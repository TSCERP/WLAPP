<?php

namespace App\Http\Controllers\sap;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Jobs\receiptProductionAlocate;
use App\Models\SanLuong;
use App\Models\notireceipt;
use Illuminate\Support\Facades\Redis;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;

class ProductionController extends Controller
{

    function receipts(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'FatherCode' => 'required|string|max:254',
            'ItemCode' => 'required|string|max:254',
            'ItemName' => 'required|string|max:254',
            'CompleQty' => 'required|numeric',
            'RejectQty' => 'required|numeric',
            'CDay' => 'required|integer',
            'CRong' => 'required|integer',
            'CDai' => 'required|integer',
            'Team' => 'required|string|max:254',
            'CongDoan' => 'required|string|max:254',
            'NexTeam' => 'required|string|max:254',
            'Type' => 'required|string|max:254',
            //'LSX' => 'required|string|max:254',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $toqc="";
        if (Auth::user()->plant=='TH')
        {
            $toqc='TH-QC';
        }
        else if (Auth::user()->plant=='TQ')
        {
            $toqc='TQ-QC';
        }
        else {
            $toqc='HG-QC';
        }
        try {
            DB::beginTransaction();
            $SLData = $request->only(['FatherCode', 'ItemCode', 'ItemName', 'CompleQty', 'RejectQty', 'CDay', 'CRong', 'CDai', 'Team', 'CongDoan', 'NexTeam', 'Type','LSX']);
            $SLData['create_by'] = Auth::user()->id;
            $SanLuong = SanLuong::create($SLData);
            if ($request->CompleQty > 0) {
                $notifi = notireceipt::create([
                    'text' => 'Số lượng đã giao chờ xác nhận',
                    'Quantity' => $request->CompleQty,
                    'baseID' =>  $SanLuong->id,
                    'SPDich' => $request->FatherCode,
                    'team' => $request->NexTeam,
                    'CongDoan' => $request->CongDoan,
                    'QuyCach' => $request->CDay . "*" . $request->CRong . "*" . $request->CDai,
                    'type' => 0
                ]);
            }
            if ($request->RejectQty > 0) {
                $notifi = notireceipt::create([
                    'text' => 'Số lượng lỗi chờ xác nhận',
                    'Quantity' => $request->RejectQty,
                    'baseID' =>  $SanLuong->id,
                    'SPDich' => $request->FatherCode,
                    'team' => $toqc,
                    'CongDoan' => $request->CongDoan,
                    'QuyCach' => $request->CDay . "*" . $request->CRong . "*" . $request->CDai,
                    'type' => 1
                ]);
            }
            DB::commit();
        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json(['message' => 'ghi nhận sản lượng không thành công', 'error' => $e->getMessage()], 500);
        }



        return response()->json([
            'message' => 'nhập sản lượng thành công'
        ], 200);
    }

    function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'TO' => 'required'
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $conDB = (new ConnectController)->connect_sap();
        $query = 'select * from UV_GHINHANSL where "TO"=?';
        $stmt = odbc_prepare($conDB, $query);

        if (!$stmt) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }

        if (!odbc_execute($stmt, [$request->TO])) {
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }

        $results = [];

        while ($row = odbc_fetch_array($stmt)) {
            $key = $row['SPDICH'];

            if (!isset($results[$key])) {
                $results[$key] = [
                    'SPDICH' => $row['SPDICH'],
                    'NameSPDich' => $row['NameSPDich'],
                    'Details' => [],
                ];
            }

            $detailsKey = $row['ItemChild'] . $row['TO'] . $row['TOTT'];

            $details = [
                'ItemChild' => $row['ItemChild'],
                'ChildName' => $row['ChildName'],
                'CDay' => $row['CDay'],
                'CRong' => $row['CRong'],
                'CDai' => $row['CDai'],
                'LSX' => [
                    [
                        'LSX' => $row['LSX'],
                        'SanLuong' => $row['SanLuong'],
                        'DaLam' => $row['DaLam'],
                        'Loi' => $row['Loi'],
                        'ConLai' => $row['ConLai'],
                    ],
                ],
                'totalsanluong' => $row['SanLuong'],
                'totalDaLam' => $row['DaLam'],
                'totalLoi' => $row['Loi'],
                'totalConLai' => $row['ConLai'],
            ];

            // Check if the composite key already exists
            $compositeKeyExists = false;
            foreach ($results[$key]['Details'] as &$existingDetails) {
                $existingKey = $existingDetails['ItemChild'] . $existingDetails['TO'] . $existingDetails['TOTT'];
                if ($existingKey === $detailsKey) {
                    $existingDetails['LSX'][] = $details['LSX'][0];
                    $existingDetails['totalsanluong'] += $row['SanLuong'];
                    $existingDetails['totalDaLam'] += $row['DaLam'];
                    $existingDetails['totalLoi'] += $row['Loi'];
                    $existingDetails['totalConLai'] += $row['ConLai'];
                    $compositeKeyExists = true;
                    break;
                }
            }

            if (!$compositeKeyExists) {
                $results[$key]['Details'][] = array_merge($details, [
                    'TO' => $row['TO'],
                    'NameTO' => $row['NameTO'],
                    'TOTT' => $row['TOTT'],
                    'NameTOTT' => $row['NameTOTT']
                ]);
            }
        }
        // collect stock pending
        $stockpending = SanLuong::join('notireceipt', 'sanluong.id', '=', 'notireceipt.baseID')
            ->where('notireceipt.type', 0)
            ->where('sanluong.Team', $request->TO)
            ->where('sanluong.Status', '!=', 1)
            ->where('notireceipt.deleted', '!=', 1)
            ->groupBy('sanluong.FatherCode', 'sanluong.ItemCode', 'sanluong.Team', 'sanluong.NexTeam')
            ->select(
                'sanluong.FatherCode',
                'sanluong.ItemCode',
                'sanluong.Team',
                'sanluong.NexTeam',
                DB::raw('sum(Quantity) as Quantity')
            )

            ->get();
        if ($stockpending !== null) {
            foreach ($results as &$result) {

                $SPDICH = $result['SPDICH'];
                foreach ($result['Details'] as &$details) {
                    $ItemChild = $details['ItemChild'];
                    $TO = $details['TO'];

                    // Find the corresponding stock pending entry
                    $stockEntry = $stockpending->first(function ($entry) use ($SPDICH, $ItemChild, $TO) {
                        return $entry['FatherCode'] == $SPDICH && $entry['ItemCode'] == $ItemChild && $entry['Team'] == $TO;
                    });

                    // Update totalConLai if the stock entry is found
                    if ($stockEntry !== null) {
                        $details['totalConLai'] = $details['totalConLai'] - $stockEntry['Quantity'];
                    }
                }
            }
        }
        odbc_close($conDB);

        $data = null;
        $data2 = null;

        //data need confirm
        if ($request->TO == "TH-QC" || $request->TO == "TQ-QC" || $request->TO == "HG-QC") {
            $data =
                DB::table('sanluong as a')
                ->join('notireceipt as b', function ($join) {
                    $join->on('a.id', '=', 'b.baseID')
                        ->where('b.deleted', '=', 0);
                })
                ->join('users as c', 'a.create_by', '=', 'c.id')
                ->select(
                    'a.FatherCode',
                    'a.ItemCode',
                    'a.ItemName',
                    'a.team',
                    'a.CongDoan',
                    'CDay',
                    'CRong',
                    'CDai',
                    'b.Quantity',
                    'a.created_at',
                    'c.first_name',
                    'c.last_name',
                    'b.text',
                    'b.id',
                    DB::raw('0 as type'),
                    'b.confirm'
                )
                ->where('b.confirm', '=', 0)
                ->where('b.type', 1)
                ->where('b.team', '=', $request->TO)
                ->get();
        } else {
            $data =
                DB::table('sanluong as a')
                ->join('notireceipt as b', function ($join) {
                    $join->on('a.id', '=', 'b.baseID')
                        ->where('b.deleted', '=', 0);
                })
                ->join('users as c', 'a.create_by', '=', 'c.id')
                ->select(
                    'a.FatherCode',
                    'a.ItemCode',
                    'a.ItemName',
                    'a.team',
                    'a.CongDoan',
                    'CDay',
                    'CRong',
                    'CDai',
                    'b.Quantity',
                    'a.created_at',
                    'c.first_name',
                    'c.last_name',
                    'b.text',
                    'b.id',
                    'b.type',
                    'b.confirm'
                )
                ->where('b.confirm', '=', 0)
                ->where('b.type', 0)
                ->where('b.team', '=', $request->TO)
                ->get();
            $data2
                = DB::table('sanluong as a')
                ->join('notireceipt as b', function ($join) {
                    $join->on('a.id', '=', 'b.baseID')
                        ->where('b.deleted', '=', 0);
                })
                ->join('users as c', 'a.create_by', '=', 'c.id')
                ->select(
                    'a.FatherCode',
                    'a.ItemCode',
                    'a.ItemName',
                    'a.team',
                    'a.CongDoan',
                    'CDay',
                    'CRong',
                    'CDai',
                    'b.Quantity',
                    'a.created_at',
                    'c.first_name',
                    'c.last_name',
                    'b.text',
                    'b.id',
                    'b.type',
                    'b.confirm'
                )
                ->where('b.confirm', '=', 0)
                ->where('b.type', 1)
                ->where('b.team', '=', $request->TO)
                ->get();
        }

        //data need handle

        return response()->json([
            'data' => $results,
            'noti_choxacnhan' => $data, 'noti_phoixuly' => $data2
        ], 200);
    }
    function viewdetail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'FatherCode' => 'required|string|max:254',
            'ItemCode' => 'required|string|max:254',
            'Team' => 'required|string|max:254',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        // COLLECT DATA SAP
        $conDB = (new ConnectController)->connect_sap();
        $query = 'select ifnull(sum("ConLai"),0) "Quantity" from UV_GHINHANSL where "ItemChild"=? and "TO"=?';
        $stmt = odbc_prepare($conDB, $query);

        if (!$stmt) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }

        if (!odbc_execute($stmt, [$request->ItemCode, $request->Team])) {
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }
        $row = odbc_fetch_array($stmt);
        $quantity = (float)$row['Quantity'];
        // collect stock pending
        $stockpending = SanLuong::join('notireceipt', 'sanluong.id', '=', 'notireceipt.baseID')
            ->where('notireceipt.type', 0)
            ->where('sanluong.Team', $request->Team)
            ->where('sanluong.ItemCode', $request->ItemCode)
            ->where('sanluong.Status', '!=', 1)
            ->where('notireceipt.deleted', '!=', 1)
            ->groupBy('sanluong.FatherCode', 'sanluong.ItemCode', 'sanluong.Team', 'sanluong.NexTeam')
            ->select(
                'sanluong.FatherCode',
                'sanluong.ItemCode',
                'sanluong.Team',
                'sanluong.NexTeam',
                DB::raw('sum(Quantity) as Quantity')
            )->get();

        if ($stockpending->count() > 0) {
            $quantity = $quantity - $stockpending->first()->Quantity;
        }
        $factory = [
            [
                'Factory' => '01',
                'FactoryName' => 'Nhà Máy CBG Thuận hưng'
            ],
            [
                'Factory' => '02',
                'FactoryName' => 'Nhà Máy CBG Yên sơn'
            ],
            [
                'Factory' => '03',
                'FactoryName' => 'Nhà Máy CBG Thái Bình'
            ],
        ];
        // lấy dữ liệu chưa confirm
        $notfication = DB::table('sanluong as a')
            ->join('notireceipt as b', function ($join) {
                $join->on('a.id', '=', 'b.baseID')
                    ->where('b.deleted', '=', 0);
            })
            ->join('users as c', 'a.create_by', '=', 'c.id')
            ->select(
                'a.FatherCode',
                'a.ItemCode',
                'a.ItemName',
                'a.team',
                'CDay',
                'CRong',
                'CDai',
                'b.Quantity',
                'a.created_at',
                'c.first_name',
                'c.last_name',
                'b.text',
                'b.id',
                'b.type',
                'b.confirm'
            )
            ->where('b.confirm', '!=', 1)
            ->where('a.FatherCode', '=', $request->FatherCode)
            ->where('a.ItemCode', '=', $request->ItemCode)
            ->where('a.Team', '=', $request->Team)
            ->get();

        return response()->json([
            //'Data' => $results, 'SLPHOIDANHAN' => $data,
            'Factorys' => $factory,
            'notifications' => $notfication,
            'maxQuantity' =>   $quantity,
            'remainQty' =>   $quantity
        ], 200);
    }
    function listo(Request $request)
    {
        $conDB = (new ConnectController)->connect_sap();

        $query = 'select b."Code", b."Name" from "@V_TO_USER" a join "@V_TO" b on a."U_To"=b."Code"
        join OUSR c on a."U_User"=c."USERID" where C."USER_CODE" =?';
        $stmt = odbc_prepare($conDB, $query);
        if (!$stmt) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }
        if (!odbc_execute($stmt, [Auth::user()->sap_id])) {
            // Handle execution error
            // die("Error executing SQL statement: " . odbc_errormsg());
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }
        $results = array();
        while ($row = odbc_fetch_array($stmt)) {
            $results[] = $row;
        }
        odbc_close($conDB);
        return response()->json($results, 200);
    }
    function reject(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required',
            'reason' => 'required'
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $data = DB::table('sanluong AS b')->join('notireceipt as a', 'a.baseID', '=', 'b.id')
            ->select('b.*')
            ->where('a.id', $request->id)
            ->where('b.Status', 0)
            ->where('a.type', 0)
            ->where('a.confirm', 0)
            ->first();

        if (!$data) {
            throw new \Exception('data không hợp lệ.');
        }
        SanLuong::where('id', $data->id)->update(['Status' => 1]);
        notireceipt::where('id', $request->id)->update(['confirm' => 3, 'confirmBy' => Auth::user()->id, 'confirm_at' => now()->format('YmdHmi'), 'text' => $request->reason]);
        return response()->json('success', 200);
    }

    function accept(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        try {
            DB::beginTransaction();
            // to bình thường


            $data = DB::table('sanluong AS b')->join('notireceipt as a', 'a.baseID', '=', 'b.id')
                ->select('b.*', 'a.id as notiID','a.team as NextTeam')
                ->where('a.id', $request->id)
                //->where('b.Status', 0)
               // ->where('a.type', 0)
                ->where('a.confirm', 0)
                ->first();
            if (!$data) {
                throw new \Exception('data không hợp lệ.');
            }

            if( $data->NextTeam != "TH-QC"  && $data->NextTeam != "TQ-QC"  && $data->NextTeam != "HG-QC")
            {
                $dataallocate = $this->collectdata($data->FatherCode, $data->ItemCode, $data->Team);
                $allocates = $this->allocate($dataallocate, $data->CompleQty);

                foreach ($allocates as $allocate) {

                    $body = [
                        "BPL_IDAssignedToInvoice" => Auth::user()->branch,
                        "DocumentLines" => [[
                            "Quantity" => $allocate['Allocate'],
                            "BaseLine" => 0,
                            //"WarehouseCode" => $allocate['Warehouse'],
                            "BaseEntry" => $allocate['DocEntry'],
                            "BaseType" => 202,
                            "BatchNumbers" => [
                                [
                                    "BatchNumber" => now()->format('Ymd') . $allocate['DocEntry'],
                                    "Quantity" => $allocate['Allocate'],
                                    "ItemCode" =>  $allocate['ItemChild'],
                                    "U_CDai" => $allocate['CDai'],
                                    "U_CRong" => $allocate['CRong'],
                                    "U_CDay" => $allocate['CDay'],
                                    "U_Status" => "HD"
                                ]
                            ]
                        ]]
                    ];
                    $response = Http::withOptions([
                        'verify' => false,
                    ])->withHeaders([
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                        'Authorization' => 'Basic ' . BasicAuthToken(),
                    ])->post(UrlSAPServiceLayer() . '/b1s/v1/InventoryGenEntries', $body);
                    $res = $response->json();
                    if ($response->successful()) {
                        SanLuong::where('id', $data->id)->update(
                            [
                                'Status' => 1,
                                // 'ObjType' =>   202,
                                // 'DocEntry' => $res['DocEntry']
                            ]
                        );
                        notireceipt::where('id', $data->notiID)->update(['confirm' => 1,
                        'ObjType' =>   202,
                        'DocEntry' => $res['DocEntry'],
                        'confirmBy' => Auth::user()->id,
                        'confirm_at' => now()->format('YmdHmi')]);
                        DB::commit();
                        return response()->json('success', 200);

                    } else {
                        DB::rollBack();
                        return response()->json([
                            'message' => 'Failed receipt',
                            'error' => $res['error'],
                            'body' => $body
                        ], 500);
                    }
                }
            }
            else
            {

                $body = [
                    "BPL_IDAssignedToInvoice" => Auth::user()->branch,
                    "DocumentLines" => [[
                        "Quantity" => $data->RejectQty,
                        "ItemCode" =>   $data->ItemCode,
                       // "BaseLine" => 0,
                        "WarehouseCode" => 'W01.1.01',
                        //"BaseEntry" => $allocate['DocEntry'],
                        //"BaseType" => 202,
                        "BatchNumbers" => [
                            [
                                "BatchNumber" => now()->format('YmdHmi'),
                                "Quantity" =>  $data->RejectQty,
                                "ItemCode" =>   $data->ItemCode,
                                "U_CDai" => $data->CDai,
                                "U_CRong" => $data->CRong,
                                "U_CDay" =>  $data->CDay,
                                "U_Status" => "HL",
                                "U_TO"=> $data->Team,
                                "U_LSX"=> $data->LSX
                            ]
                        ]
                    ]]
                ];
                $response = Http::withOptions([
                    'verify' => false,
                ])->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Authorization' => 'Basic ' . BasicAuthToken(),
                ])->post(UrlSAPServiceLayer() . '/b1s/v1/InventoryGenEntries', $body);
                $res = $response->json();
                if ($response->successful()) {
                    SanLuong::where('id', $data->id)->update(
                        [
                            'Status' => 1,
                            // 'ObjType' =>   59,
                            // 'DocEntry' => $res['DocEntry']
                        ]
                    );
                    notireceipt::where('id', $request->id)->
                    update(['confirm' => 1,
                    'ObjType' =>  59,
                    'DocEntry' => $res['DocEntry'],
                    'confirmBy' => Auth::user()->id,
                    'confirm_at' => now()->format('YmdHmi')]);
                    DB::commit();
                    return response()->json('success', 200);

                } else {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Failed receipt',
                        'error' => $res['error'],
                        'body' => $body
                    ], 500);
                }
            }


            // receiptProductionAlocate::dispatch($body, $data->id, 202);


        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    function dsphoipending(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'team' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $data = notireceipt::where('team', $request->team)->where('confirm', 0)->get();
        return response()->json($data, 200);
    }
    function delete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $data = DB::table('notireceipt as a')
            ->where('a.id', $request->id)
            ->where('a.deleted', 0)
            ->first();
        if (!$data) {
            throw new \Exception('data không hợp lệ.');
        }
        notireceipt::where('id', $data->id)->update(['deleted' => 1, 'deleteBy' => Auth::user()->id, 'deleted_at' => now()->format('YmdHmi')]);
        return response()->json('success', 200);
    }
    function collectdata($spdich, $item, $to)
    {
        $conDB = (new ConnectController)->connect_sap();
        $query = 'select * from UV_DetailGHINHANSL where "SPDICH"=? and "ItemChild"=? and "TO"=? order by "DocEntry" asc';
        $stmt = odbc_prepare($conDB, $query);
        if (!$stmt) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }
        if (!odbc_execute($stmt, [$spdich, $item, $to])) {
            // Handle execution error
            // die("Error executing SQL statement: " . odbc_errormsg());
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }
        $results = array();

        while ($row = odbc_fetch_array($stmt)) {
            $results[] = $row;
        };
        odbc_close($conDB);
        return  $results;
    }
    function allocate($data, $totalQty)
    {
        foreach ($data as &$item) {
            // Sử dụng isset() thay vì so sánh với phần tử đầu tiên trong mảng
            if (
                isset($item['ConLai']) && $item['ConLai'] <= $totalQty
            ) {
                $item['Allocate'] = $item['ConLai'];
                $totalQty -= $item['ConLai'];
            } else {
                // Chỉ cập nhật giá trị nếu Qty lớn hơn 0
                if ($item['ConLai'] > 0) {
                    $item['Allocate'] = min($item['ConLai'], $totalQty);
                    $totalQty -= $item['Allocate'];
                } else {
                    $item['Allocate'] = 0;
                }
            }
        }

        // Sử dụng array_filter với callback ngắn gọn hơn
        $filteredData = array_filter($data, fn ($item) => $item['Allocate'] != 0);

        return array_values($filteredData);
    }
}
