<?php

namespace App\Http\Controllers\sap;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Controllers\sap\ConnectController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class GoodsManagementController extends Controller
{
    // 1. Lấy danh sách kho quản lý bin
    function getBinManagedWarehouses(Request $request)
    {
        try {
            $conDB = (new ConnectController)->connect_sap();

            $query = 'SELECT "WhsCode", "WhsName", "U_FAC" FROM OWHS WHERE "BPLid" = ? AND "BinActivat" = ?;';

            $stmt = odbc_prepare($conDB, $query);
            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($stmt, [Auth::user()->branch, 'Y'])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = array();
            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
            }
            odbc_close($conDB);
            return response()->json($results, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 2. Lấy danh sách bin trong kho (ngoại trừ bin default)
    function getBinByWarehouse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $conDB = (new ConnectController)->connect_sap();

            $query = 'SELECT t1."WhsCode", t0."AbsEntry", t0."BinCode", case When t1."DftBinAbs"=t0."AbsEntry" then \'Y\' ELSE \'N\' end "isDefaultBin" FROM OBIN T0 JOIN OWHS T1 ON T0."WhsCode"=T1."WhsCode" AND T0."Deleted"=\'N\' WHERE T1."WhsCode"=? AND T0."SysBin"=?';


            $stmt = odbc_prepare($conDB, $query);
            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($stmt, [$request->warehouse, 'N'])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = array();
            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
            }
            odbc_close($conDB);
            return response()->json($results, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 2. Lấy tất cả bin trong kho (kể cả bin default)
    function getAllBinByWarehouse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $conDB = (new ConnectController)->connect_sap();

            $query = 'SELECT t1."WhsCode", t0."AbsEntry", t0."BinCode", case When t1."DftBinAbs"=t0."AbsEntry" then \'Y\' ELSE \'N\' end "isDefaultBin" FROM OBIN T0 JOIN OWHS T1 ON T0."WhsCode"=T1."WhsCode" AND T0."Deleted"=\'N\' WHERE T1."WhsCode"=?';


            $stmt = odbc_prepare($conDB, $query);
            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($stmt, [$request->warehouse])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = array();
            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
            }
            odbc_close($conDB);
            return response()->json($results, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Lấy danh sách Item trong bin mặc định khi có mã kho (Đối với trường hợp xếp bin)
    function getDefaultBinItemsByWarehouse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $conDB = (new ConnectController)->connect_sap();

            // Lấy thông tin bin mặc định
            $getBinQuery = 'SELECT t1."WhsCode", t0."AbsEntry", t0."BinCode", case When t1."DftBinAbs"=t0."AbsEntry" then \'Y\' ELSE \'N\' end "isDefaultBin" FROM OBIN T0 JOIN OWHS T1 ON T0."WhsCode"=T1."WhsCode" AND T0."Deleted"=\'N\' WHERE T1."WhsCode"=?;';


            $getBinStmt = odbc_prepare($conDB, $getBinQuery);
            if (!$getBinStmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($getBinStmt, [$request->warehouse])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $BinList = array();
            while ($row = odbc_fetch_array($getBinStmt)) {
                $BinList[] = $row;
            }

            $DefaultBinID = null;
            $DefaultBinCode = null;

            // Lặp qua danh sách BinList để tìm bản ghi có isDefaultBin = 'Y'
            foreach ($BinList as $bin) {
                if ($bin['isDefaultBin'] === 'Y') {
                    $DefaultBinID = $bin['AbsEntry'];
                    $DefaultBinCode = $bin['BinCode'];
                    break; // Dừng lặp khi đã tìm thấy giá trị
                }
            }

            $query = 'CALL "USP_GETINVENTORYDETAILS"(?, ?)';

            $stmt = odbc_prepare($conDB, $query);
            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($stmt, [$request->warehouse, $DefaultBinCode])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = array();
            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
            }
            odbc_close($conDB);
            return response()->json([
                "DefaultBinCode" => $DefaultBinCode,
                "DefaultBinID" => $DefaultBinID,
                "ItemData" => $results
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Lấy danh sách Item trong bin bất kỳ
    function getItemsByBin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse' => 'required',
            'bin' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $conDB = (new ConnectController)->connect_sap();

            $BinCode = $request->bin;

            $query = 'CALL "USP_GETINVENTORYDETAILS"(?, ?)';

            $stmt = odbc_prepare($conDB, $query);
            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($stmt, [$request->warehouse, $BinCode])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = array();
            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
            }
            odbc_close($conDB);
            return response()->json([
                "ItemData" => $results
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Lấy danh sách batch của item
    function getBatchByItemDefaultBin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse' => 'required',
            'code' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $conDB = (new ConnectController)->connect_sap();

            // Lấy thông tin bin mặc định
            $getBinQuery = 'SELECT t1."WhsCode", t0."AbsEntry", t0."BinCode", case When t1."DftBinAbs"=t0."AbsEntry" then \'Y\' ELSE \'N\' end "isDefaultBin" FROM OBIN T0 JOIN OWHS T1 ON T0."WhsCode"=T1."WhsCode" AND T0."Deleted"=\'N\' WHERE T1."WhsCode"=?;';


            $getBinStmt = odbc_prepare($conDB, $getBinQuery);
            if (!$getBinStmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($getBinStmt, [$request->warehouse])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $BinList = array();
            while ($row = odbc_fetch_array($getBinStmt)) {
                $BinList[] = $row;
            }

            $DefaultBinCode = null;

            // Lặp qua danh sách BinList để tìm bản ghi có isDefaultBin = 'Y'
            foreach ($BinList as $bin) {
                if ($bin['isDefaultBin'] === 'Y') {
                    $DefaultBinCode = $bin['BinCode'];
                    break; // Dừng lặp khi đã tìm thấy giá trị
                }
            }
            $query = 'CALL "USP_GETINVENTORYDETAILS"(?, ?)';
            $stmt = odbc_prepare($conDB, $query);

            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }

            if (!odbc_execute($stmt, [$request->warehouse, $DefaultBinCode, $request->code])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = [];
            $hasBatch = false;

            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
                if (!empty($row['BatchNum'])) {
                    $hasBatch = true;
                }
            }

            $results = array_filter($results, fn($item) => $item['ItemCode'] === $request->code);

            odbc_close($conDB);

            $response = [];

            // dd($results);

            if ($hasBatch) {
                // Trả về danh sách BatchNum và OnHand tương ứng
                $response = array_map(function ($item) {
                    return [
                        'BatchNum' => $item['BatchNum'],
                        'OnHand'   => $item['Quantity']
                    ];
                }, array_filter($results, fn($item) => !empty($item['BatchNum'])));
            } else {
                $totalOnHand = array_sum(array_column($results, 'Quantity'));
                $response = [];
            }

            $responsePayload = [
                'BatchData' => $response
            ];

            if (!$hasBatch) {
                $responsePayload['OnHand'] = $totalOnHand;
            }

            return response()->json($responsePayload, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Lấy danh sách batch của item
    function getBatchByItem(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse' => 'required',
            'bin' => 'required',
            'code' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $conDB = (new ConnectController)->connect_sap();

            $query = 'CALL "USP_GETINVENTORYDETAILS"(?, ?)';
            $stmt = odbc_prepare($conDB, $query);

            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }

            if (!odbc_execute($stmt, [$request->warehouse, $request->bin, $request->code])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }

            $results = [];
            $hasBatch = false;

            while ($row = odbc_fetch_array($stmt)) {
                $results[] = $row;
                if (!empty($row['BatchNum'])) {
                    $hasBatch = true;
                }
            }

            $results = array_filter($results, fn($item) => $item['ItemCode'] === $request->code);

            odbc_close($conDB);

            $response = [];

            // dd($results);

            if ($hasBatch) {
                // Trả về danh sách BatchNum và OnHand tương ứng
                $response = array_map(function ($item) {
                    return [
                        'BatchNum' => $item['BatchNum'],
                        'OnHand'   => $item['Quantity']
                    ];
                }, array_filter($results, fn($item) => !empty($item['BatchNum'])));
            } else {
                $totalOnHand = array_sum(array_column($results, 'Quantity'));
                $response = [];
            }

            $responsePayload = [
                'BatchData' => $response
            ];

            if (!$hasBatch) {
                $responsePayload['OnHand'] = $totalOnHand;
            }

            return response()->json($responsePayload, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Điều chuyển kho
    // public function StockTransfer(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'transferData' => 'required',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
    //     }

    //     try {
    //         $conDB = (new ConnectController)->connect_sap();

    //         $url = 'https://sap.woodsland.com.vn:50000/b1s/v2/StockTransfers';
    //         $headers = [
    //             'Content-Type' => 'application/json',
    //             'Authorization' => 'Bearer ' . config('services.sap.token')
    //         ];
    //         $data = [
    //             'DocumentDate' => date('d.m.y'),
    //             'Comments' => 'Điều chuyển hàng hóa trên Web Portal',
    //             'StockTransferLines' => [
    //                 [
    //                     "ItemCode" => $request->item_code,
    //                     "Quantity" => $request->quantity,
    //                     "FromWarehouseCode" => $request->from_warehouse,
    //                     "WarehouseCode" => $request->to_warehouse,
    //                     "StockTransferLinesBinAllocations" => [
    //                         [
    //                             "BinAbsEntry" => $request->from_bin,
    //                             "Quantity" => $request->quantity,
    //                             "AllowNegativeQuantity" => "tNO",
    //                             "SerialAndBatchNumbersBaseLine" => -1,
    //                             "BinActionType" => "batFromWarehouse",
    //                             "BaseLineNumber" => 0
    //                         ],
    //                         [
    //                             "BinAbsEntry" => $request->to_bin,
    //                             "Quantity" => $request->quantity,
    //                             "AllowNegativeQuantity" => "tNO",
    //                             "SerialAndBatchNumbersBaseLine" => -1,
    //                             "BinActionType" => "batToWarehouse",
    //                             "BaseLineNumber" => 0
    //                         ]
    //                     ],
    //                 ]
    //             ]
    //         ];

    //         $data = json_encode($data);

    //         $response = Http::withHeaders($headers)->post($url, $data);
    //         if ($response->status() != 200) {
    //             return response()->json([
    //                 'error' => true,
    //                 'status_code' => $response->status(),
    //                 'message' => 'L i khi chuyen kho'
    //             ], $response->status());
    //         }

    //         return response()->json($response->json(), 200);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'error' => false,
    //             'status_code' => 500,
    //             'message' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    private function extractErrorMessage($response)
    {
        if (isset($response['error']['message']['value'])) {
            return $response['error']['message']['value'];
        }
        
        if (isset($response['error']['message'])) {
            return $response['error']['message'];
        }
        
        if (isset($response['message'])) {
            return $response['message'];
        }
        
        return 'Có lỗi xảy ra trong quá trình xử lý';
    }

    public function StockTransfer(Request $request)
    {
        // Validator kiểm tra trường 'transferData'
        $validator = Validator::make($request->all(), [
            'transferData' => 'required|array',
            'transferData.fromWarehouse' => 'required|string',
            'transferData.toWarehouse' => 'required|string',
            'transferData.body' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        try {
            $transferData = $request->input('transferData');
            $stockTransferLines = [];

            // Tạo dữ liệu StockTransferLines
            foreach ($transferData['body'] as $index => $item) {
                $stockTransferLine = [
                    "ItemCode" => $item['item'],
                    "Quantity" => floatval($item['quantity']),
                    "FromWarehouseCode" => $transferData['fromWarehouse'],
                    "WarehouseCode" => $transferData['toWarehouse'],
                    "UseBaseUnits" => "tYES",
                    "StockTransferLinesBinAllocations" => [
                        [
                            "BinAbsEntry" => intval($item['fromBin']),
                            "Quantity" => floatval($item['quantity']),
                            "AllowNegativeQuantity" => "tNO",
                            "SerialAndBatchNumbersBaseLine" => -1,
                            "BinActionType" => "batFromWarehouse",
                            "BaseLineNumber" => $index
                        ],
                        [
                            "BinAbsEntry" => intval($item['toBin']),
                            "Quantity" => floatval($item['quantity']),
                            "AllowNegativeQuantity" => "tNO",
                            "SerialAndBatchNumbersBaseLine" => -1,
                            "BinActionType" => "batToWarehouse",
                            "BaseLineNumber" => $index
                        ]
                    ],
                    "BatchNumbers"  => [
                        "BatchNumber" => $item['batch'] || "",
                        "Quantity" => floatval($item['quantity']) || 0,
                    ],
                ];

                // Chỉ thêm BatchNumbers nếu có batch number
                if (!empty($item['batch'])) {
                    $stockTransferLine["BatchNumbers"] = [
                        "BatchNumber" => $item['batch'],
                        "Quantity" => floatval($item['quantity'])
                    ];
                }

                $stockTransferLines[] = $stockTransferLine;
            }

            $body = [
                "BPLID" => Auth::user()->branch,
                'Comments' => 'Điều chuyển hàng hóa trên Web Portal',
                'FromWarehouse' => $transferData['fromWarehouse'],
                'ToWarehouse' => $transferData['toWarehouse'],
                'StockTransferLines' => $stockTransferLines
            ];

            // dd($body);

            $response = Http::withOptions([
                'verify' => false,
            ])->withHeaders([
                "Content-Type" => "application/json",
                "Accept" => "application/json",
                "Authorization" => "Basic " . BasicAuthToken(),
            ])->post(UrlSAPServiceLayer() . "/b1s/v1/StockTransfers", $body);

            $responseBody = $response->json();

            // Kiểm tra xem response có chứa thông tin lỗi không
            if (isset($responseBody['error']) || 
                (isset($responseBody['message']) && str_contains(strtolower($responseBody['message']), 'error'))) {
                
                $errorMessage = $this->extractErrorMessage($responseBody);
                
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'data' => null
                ], 400);
            }
    
            // Nếu không có lỗi, trả về kết quả thành công
            return response()->json([
                'success' => true,
                'message' => 'Điều chuyển hàng hóa thành công',
                'data' => $responseBody
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
