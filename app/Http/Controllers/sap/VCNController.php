<?php

namespace App\Http\Controllers\sap;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\notireceiptVCN;
use App\Models\historySLVCN;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;

class VCNController extends Controller
{
    // Ghi nhận sản lượng
    function receipts(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'FatherCode' => 'required|string|max:254',
            'ItemCode' => 'required|string|max:254',
            'ItemName' => 'required|string|max:254',
            'CompleQty' => 'required|numeric',
            'RejectQty' => 'required|numeric',
            'version' => 'required|string|max:254',
            'CDay' => 'required|numeric',
            'CRong' => 'required|numeric',
            'CDai' => 'required|numeric',
            'Team' => 'required|string|max:254',
            'CongDoan' => 'required|string|max:254',
            'NexTeam' => 'required|string|max:254',
            'ProdType' => 'required|string|max:254',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $toqc = "";
        if (Auth::user()->plant == 'TH') {
            $toqc = 'TH-QC';
        } else if (Auth::user()->plant == 'TQ') {
            $toqc = 'TQ-QC';
        } else {
            $toqc = 'HG-QC';
        }
        try {
            DB::beginTransaction();
            $changedData = []; // Mảng chứa dữ liệu đã thay đổi trong bảng notirecept
            $errorData = json_encode($request->ErrorData);
            if ($request->CompleQty > 0) {
                $notifi = notireceiptVCN::create([
                    'text' => 'Production information waiting for confirmation',
                    'Quantity' => $request->CompleQty,
                    'MaThiTruong' => $request->MaThiTruong,
                    'FatherCode' => $request->FatherCode,
                    'ItemCode' => $request->ItemCode,
                    'ItemName' => $request->ItemName,
                    'team' => $request->Team,
                    'NextTeam' => $request->NexTeam,
                    'CongDoan' => $request->CongDoan,
                    'QuyCach' => $request->CDay . "*" . $request->CRong . "*" . $request->CDai,
                    'type' => 0,
                    'openQty' => 0,
                    'ProdType'=> $request->ProdType,
                    'Version'=> $request->version,
                ]);
                $changedData[] = $notifi; // Thêm dữ liệu đã thay đổi vào mảng
            }
            if ($request->RejectQty > 0) {
                $notifi = notireceiptVCN::create([
                    'text' => 'Error information sent to QC',
                    'FatherCode' => $request->FatherCode,
                    'ItemCode' => $request->ItemCode,
                    'ItemName' => $request->ItemName,
                    'Quantity' => $request->RejectQty,
                    'SubItemCode' => $request->SubItemCode,//mã báo lỗi
                    'SubItemName' => $request->SubItemName,//tên mã báo lỗi
                    'team' => $request->Team,
                    'NextTeam' => $toqc,
                    'CongDoan' => $request->CongDoan,
                    'QuyCach' => $request->CDay . "*" . $request->CRong . "*" . $request->CDai,
                    'type' => 1,
                    'openQty' => $request->RejectQty,
                    'ProdType'=> $request->ProdType,
                    'ErrorData' => $errorData,
                    'MaThiTruong' => $request->MaThiTruong,
                ]);
                $changedData[] = $notifi; // Thêm dữ liệu đã thay đổi vào mảng
            }
            DB::commit();
        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json(['message' => 'ghi nhận sản lượng không thành công', 'error' => $e->getMessage()], 500);
        }
        return response()->json([
            'message' => 'Successful',
            'data' => $changedData
        ], 200);
    }

    // Danh sách sản lượng
    function index(Request $request)
    {
        // 1. Nhận vào tham số "TO", nếu không nhận được tham số sẽ báo lỗi
        $validator = Validator::make($request->all(), [
            'TO' => 'required'
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        // 2. Kết nối SAP và lấy dữ liệu từ bảng UV_GHINHANSLVCN dựa trên "TO" và lấy ra tất cả các kết quả có TO bằng với TO trong tham số truyền vào
        $conDB = (new ConnectController)->connect_sap();
        $query = 'select * from UV_GHINHANSLVCN where "TO"=? order by "LSX" asc ';
        $stmt = odbc_prepare($conDB, $query);

        if (!$stmt) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }

        if (!odbc_execute($stmt, [$request->TO])) {
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }

        // 3. Tạo mảng results[] và trả về dữ liệu
        $results = [];

        // 3.1. Tạo một key có giá trị là 'SPDICH' và lọc qua toàn bộ kết quả tìm được, sau đó gom nhóm các sản phẩm có cùng SPDICH
        while ($row = odbc_fetch_array($stmt)) {
            $key = $row['SPDICH'];

            //Đối với các kết quả key tìm được, tạo một mảng có các trường sau
            if (!isset($results[$key])) {
                $results[$key] = [
                    'SPDICH' => $row['SPDICH'],
                    'NameSPDich' => $row['NameSPDich'],
                    'MaThiTruong' => $row['MaThiTruong'],
                    'Details' => [],
                ];
            }
            // 3.2. Tạo key có giá trị hỗn hợp là ItemChild.TO.TOTT
            $detailsKey = $row['ItemChild'] . $row['TO'] . $row['TOTT'].$row['Version'];

            $details = [
                'ItemChild' => $row['ItemChild'],
                'ChildName' => $row['ChildName'],
                'Version'=>$row['Version'],
                'ProdType'=> $row['ProType'],
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
                $existingKey = $existingDetails['ItemChild'] . $existingDetails['TO'] . $existingDetails['TOTT'].$existingDetails['Version'];
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
        $stockpending =notireceiptVCN::where('type', 0)
            ->where('Team', $request->TO)
            ->where('deleted', '!=', 1)
            ->groupBy('FatherCode', 'ItemCode', 'Team', 'NextTeam')
            ->select(
                'FatherCode',
                'ItemCode',
                'Team',
                'NextTeam',
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

        $data = null;
        $datacxl = null;

        //data need confirm
        if ($request->TO == "TH-QC" || $request->TO == "TQ-QC" || $request->TO == "HG-QC") {
            $data = null;
        } else {
            $data =notireceiptVCN::where('type','=', 0)->where('NextTeam', $request->TO)->where('confirm','=', 0)
            ->where('deleted','=', 0)->get();
            // $datacxl= notireceiptVCN::where('type','=', 1)->where('NextTeam', $request->TO)->where('confirm','=', 0)
            //     ->where('deleted','=', 0)->get();
        }

        //data need handle

        return response()->json([
            'data' => $results,
            'noti_choxacnhan' => $data, 'noti_phoixuly' => $datacxl
        ], 200);
    }

    // Load số lượng tồn
    function viewdetail(Request $request)
    {
        // 1. Nhận vào giá trị "SPDICH", "ItemCode', "To" từ request
        $validator = Validator::make($request->all(), [
            'SPDICH' => 'required|string|max:254',
            'ItemCode' => 'required|string|max:254',
            'TO' => 'required|string|max:254',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
            // Return validation errors with a 422 Unprocessable Entity status code
        }

        // 2. Truy vấn cơ sở dữ liệu SAP
        $conDB = (new ConnectController)->connect_sap();

        // Code cũ
        $query = 'select ifnull(sum("ConLai"),0) "Quantity" from UV_GHINHANSLVCN where "ItemChild"=? and "TO"=? and "SPDICH"=?';
        $stmt = odbc_prepare($conDB, $query);

        if (!$stmt) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }

        if (!odbc_execute($stmt, [$request->ItemCode, $request->TO, $request->SPDICH])) {
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }
        $row = odbc_fetch_array($stmt);

        // dd($row);
        $RemainQuantity = (float)$row['Quantity'];

        // dd($quantity);

        // Code mới (thêm "stock")
        $querystock = 'SELECT * FROM UV_SOLUONGTONVCN WHERE "U_SPDICH"=? AND "ItemCode"=? AND"U_To"=?';
        $stmtstock = odbc_prepare($conDB, $querystock);

        if (!$stmtstock) {
            throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
        }

        if (!odbc_execute($stmtstock, [$request->SPDICH, $request->ItemCode, $request->TO])) {
            throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
        }
        $rowstock = odbc_fetch_array($stmtstock);
        $results = array();
        while ($rowstock = odbc_fetch_array($stmtstock)) {
            $results[] = $rowstock;
        }

        // Lấy công đoạn hiện tại
        $CongDoan = null;
        foreach ($results as $result) {
            $U_CDOAN = $result['U_CDOAN'];

            if ($CongDoan === null) {
                $CongDoan = $U_CDOAN;
            } else {
                if ($U_CDOAN !== $CongDoan) {
                    return response()->json(['error' => 'Các giá trị của U_CDOAN trong LSX không giống nhau!'], 422);
                }
            }
        }

        // Lấy kho của bán thành phẩm
        $SubItemWhs = null;
        foreach ($results as $result) {
            $wareHouse = $result['wareHouse'];

            if ($SubItemWhs === null) {
                $SubItemWhs = $wareHouse;
            } else {
                if ($wareHouse !== $SubItemWhs) {
                    return response()->json(['error' => 'Các giá trị của wareHouse trong LSX không giống nhau!'], 422);
                }
            }
        }

        // dd($results);
        $history = historySLVCN::where('to', $request->TO)
            ->where('itemchild', $request->ItemCode)
            ->select('id', 'LSX', 'SPDICH', 'itemchild', 'to', 'quantity', 'DocEntry',)
            ->get();
        $data = $history->toArray();

        // dd($results);
        $stock = [];

        $groupedResults = [];

        foreach ($results as $result) {
            $itemCode = $result['ItemCode'];
            $subItemCode = $result['SubItemCode'];
            $subItemName = $result['SubItemName'];
            $onHand = (float) $result['OnHand'];
            $baseQty = (float) $result['BaseQty'];

            if (!array_key_exists($subItemCode, $groupedResults)) {
                $groupedResults[$subItemCode] = [
                    'SubItemCode' => $subItemCode,
                    'SubItemName' => $subItemName,
                    'OnHand' => 0,
                    'BaseQty' => $baseQty,
                ];
            }

            if ($CongDoan === 'SC') {
                // Tính toán giá trị OnHand dựa trên yêu cầu khi $CongDoan là 'SC'
                $quantity = historySLVCN::where('to', $request->TO)
                    ->where('itemchild', $itemCode)
                    ->sum(DB::raw('quantity * ' . $baseQty)); // Tính giá trị tổng quantity * baseQty

                $groupedResults[$subItemCode]['OnHand'] = ceil($onHand - $quantity); // Làm tròn lên
            } else {
                $groupedResults[$subItemCode]['OnHand'] = $onHand;
            }
        }

        $maxQuantities = [];


        foreach ($groupedResults as $result) {
            $onHand = $result['OnHand'];
            $baseQty = $result['BaseQty'];

            $maxQuantity = floor($onHand / $baseQty); 
            $maxQuantities[] = $maxQuantity;
        }
   
        // Tìm số lượng tối thiểu 
        $maxQty = $maxQty = !empty($maxQuantities) ? min($maxQuantities) : 0;

        // Chuyển mảng kết quả về dạng danh sách
        $groupedResults = array_values($groupedResults);

        // 3. Lấy số lượng còn lại phải sản xuất

        // Dữ liệu nhà máy, gửi kèm thôi chứ không có xài
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

        $ItemInfo=notireceiptVCN::where('ItemCode',$request->ItemCode)
        ->select(
            'ItemCode',
            'ItemName',
        )
        ->first();

        // 4. Lấy danh sách sản lượng và lỗi đã ghi nhận
        $notification = DB::table('notireceiptVCN as a')
            ->join('users as c', 'a.CreatedBy', '=', 'c.id')
            ->select(
                'a.FatherCode',
                'a.ItemCode',
                'a.ItemName',
                'a.SubItemName',
                'a.SubItemCode',
                'a.team',
                'CDay',
                'CRong',
                'CDai',
                'a.Quantity',
                'a.created_at',
                'c.first_name',
                'c.last_name',
                'a.text',
                'a.id',
                'a.type',
                'a.confirm'
            )
            ->where('a.confirm', '!=', 1)
            ->where('a.deleted', '=', 0)
            ->where('a.FatherCode', '=', $request->SPDICH)
            ->where('a.ItemCode', '=', $request->ItemCode)
            ->where('a.Team', '=', $request->TO)
            ->get();
        
            // dd($notification);
            $WaitingConfirmQty = $notification->where('type', '=', 0)->sum('Quantity');

        // 5. Trả về kết quả cho người dùng
        return response()->json([
            'ItemInfo' => $ItemInfo,
            'CongDoan'  =>  $CongDoan,
            'SubItemWhs' => $SubItemWhs,
            'notifications' => $notification,
            'stock' => $groupedResults,
            'maxQty' =>   $maxQty,
            'WaitingConfirmQty' => $WaitingConfirmQty,
            'remainQty' =>   $RemainQuantity,
            'Factorys' => $factory,
        ], 200);
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
        $data =notireceiptVCN::where('id', $request->id)->where('confirm', 0)->first();
        if (!$data) {
            throw new \Exception('data không hợp lệ.');
        }
        notireceiptVCN::where('id', $request->id)->update(['confirm' => 3, 'confirmBy' => Auth::user()->id, 'confirm_at' => now()->format('YmdHmi'), 'text' => $request->reason]);
        return response()->json('success', 200);
    }
    function dsphoipending(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'team' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $data = notireceiptVCN::where('NextTeam', $request->team)->where('confirm', 0)->get();
        return response()->json($data, 200);
    }
    function delete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required',
            'SPDICH' => 'required|string|max:254',
            'ItemCode' => 'required|string|max:254',
            'TO' => 'required|string|max:254',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $data =notireceiptVCN::where('id', $request->id)->where('deleted', 0)->first();
        if (!$data) {
            throw new \Exception('data không hợp lệ.');
        }
        notireceiptVCN::where('id', $data->id)->update(['deleted' => 1, 'deleteBy' => Auth::user()->id, 'deleted_at' => now()->format('YmdHmi')]);

        $notification = DB::table('notireceiptVCN as a')
        ->join('users as c', 'a.CreatedBy', '=', 'c.id')
        ->select(
            'a.FatherCode',
            'a.ItemCode',
            'a.ItemName',
            'a.team',
            'CDay',
            'CRong',
            'CDai',
            'a.Quantity',
            'a.created_at',
            'c.first_name',
            'c.last_name',
            'a.text',
            'a.id',
            'a.type',
            'a.confirm'
        )
        ->where('a.confirm', '!=', 1)
        ->where('a.deleted', '=', 0)
        ->where('a.FatherCode', '=', $request->SPDICH)
        ->where('a.ItemCode', '=', $request->ItemCode)
        ->where('a.Team', '=', $request->TO)
        ->get();
    
        $WaitingConfirmQty = $notification->sum('Quantity');

        return response()->json([
            'message' => 'success',
            'WaitingConfirmQty' => $WaitingConfirmQty,
        ], 200);
    }
    function collectdata($spdich, $item, $to)
    {

        $conDB = (new ConnectController)->connect_sap();
        $query = 'select * from UV_DETAILGHINHANSL_VCN where "SPDICH"=? and "ItemChild"=? and "TO"=? order by "LSX" asc';
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
            $data =notireceiptVCN::where('id', $request->id)->where('confirm', 0)->first();
            if (!$data) {
                throw new \Exception('data không hợp lệ.');
            }
            if ($data->NextTeam != "TH-QC"  && $data->NextTeam != "TQ-QC"  && $data->NextTeam != "HG-QC") {
                $dataallocate = $this->collectdata($data->FatherCode, $data->ItemCode, $data->team);
                $allocates = $this->allocate($dataallocate, $data->Quantity);
                if (count($allocates) == 0) {
                    return response()->json([
                        'error' => false,
                        'status_code' => 500,
                        'message' => "Không có sản phẩm còn lại để phân bổ. kiểm tra tổ:" .
                            $data->Team . " sản phẩm: " .
                            $data->ItemCode . " sản phẩm đích: " .
                            $data->FatherCode . " LSX." . $data->LSX
                    ], 500);
                }
                foreach ($allocates as $allocate) {

                    $body = [
                        "BPL_IDAssignedToInvoice" => Auth::user()->branch,
                        "U_LSX" => $data->LSX,
                        "U_TO" => $data->Team,
                        "DocumentLines" => [[
                            "Quantity" => $allocate['Allocate'],
                            "TransactionType" => "C",
                            "BaseEntry" => $allocate['DocEntry'],
                            "BaseType" => 202,
                            "BatchNumbers" => [
                                [
                                    "BatchNumber" => now()->format('YmdHmi') . $allocate['DocEntry'],
                                    "Quantity" => $allocate['Allocate'],
                                    "ItemCode" =>  $allocate['ItemChild'],
                                    "U_CDai" => $allocate['CDai'],
                                    "U_CRong" => $allocate['CRong'],
                                    "U_CDay" => $allocate['CDay'],
                                    "U_Status" => "HD",
                                    "U_Year" => $request->year ?? now()->format('y'),
                                    "U_Week" => $request->week ? str_pad($request->week, 2, '0', STR_PAD_LEFT) : str_pad(now()->weekOfYear, 2, '0', STR_PAD_LEFT)
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
                        notireceiptVCN::where('id', $data->notiID)->update([
                            'confirm' => 1,
                            'ObjType' =>   202,
                            // 'DocEntry' => $res['DocEntry'],
                            'confirmBy' => Auth::user()->id,
                            'confirm_at' => now()->format('YmdHmi')
                        ]);
                        historySLVCN::create(
                            [
                                'LSX' => $data->LSX,
                                'itemchild' => $allocate['ItemChild'],
                                'SPDich' => $data->FatherCode,
                                'to' => $data->Team,
                                'quantity' => $allocate['Allocate'],
                                'ObjType' => 202,
                                'DocEntry' => $res['DocEntry']
                            ]
                        );
                        DB::commit();
                    } else {
                        DB::rollBack();
                        return response()->json([
                            'message' => 'Failed receipt',
                            'error' => $res['error'],
                            'body' => $body
                        ], 500);
                    }
                }
                return response()->json('success', 200);
            } else {
                return response()->json([
                    'error' => false,
                    'status_code' => 500,
                    'message' => "Tổ không hợp lệ."
                ], 500);
            }
        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    function getQCWarehouseByUser($plant)
    {
        $WHS=GetWhsCode(Auth::user()->plant,'QC');
        return $WHS;
    }
    function AcceptQCVCN(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required',
            'Qty' => 'required'
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        try {
            DB::beginTransaction();
            // to bình thường
            $data =notireceiptVCN::where('id', $request->id)->where('confirm', 0)->first();
            if (!$data) {
                throw new \Exception('data không hợp lệ.');
            }

            if ($data->NextTeam != "TH-QC"  && $data->NextTeam != "TQ-QC"  && $data->NextTeam != "HG-QC") {
                $dataallocate = $this->collectdata($data->FatherCode, $data->ItemCode, $data->team);
                $allocates = $this->allocate($dataallocate, $request->Qty);
                dd($allocates);
                if (count($allocates) == 0) {
                    return response()->json([
                        'error' => false,
                        'status_code' => 500,
                        'message' => "Không có sản phẩm còn lại để phân bổ. kiểm tra tổ:" .
                            $data->Team . " sản phẩm: " .
                            $data->ItemCode . " sản phẩm đích: " .
                            $data->FatherCode . " LSX." . $data->LSX
                    ], 500);
                }
                foreach ($allocates as $allocate) {

                    $body = [
                        "BPL_IDAssignedToInvoice" => Auth::user()->branch,
                        "U_LSX" => $data->LSX,
                        "U_TO" => $data->Team,
                        "DocumentLines" => [[
                            "Quantity" => $allocate['Allocate'],
                            "TransactionType" => "R",
                            "BaseEntry" => $allocate['DocEntry'],
                            "BaseType" => 202,
                            "BatchNumbers" => [
                                [
                                    "BatchNumber" => now()->format('YmdHmi') . $allocate['DocEntry'],
                                    "Quantity" => $allocate['Allocate'],
                                    "ItemCode" =>  $allocate['ItemChild'],
                                    "U_CDai" => $allocate['CDai'],
                                    "U_CRong" => $allocate['CRong'],
                                    "U_CDay" => $allocate['CDay'],
                                    "U_Status" => "HD",
                                    "U_Year" => $request->year ?? now()->format('y'),
                                    "U_Week" => $request->week ? str_pad($request->week, 2, '0', STR_PAD_LEFT) : str_pad(now()->weekOfYear, 2, '0', STR_PAD_LEFT)
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
                        notireceiptVCN::where('id', $data->notiID)->update([
                            'confirm' => 1,
                            'ObjType' =>   202,
                            // 'DocEntry' => $res['DocEntry'],
                            'confirmBy' => Auth::user()->id,
                            'confirm_at' => now()->format('YmdHmi')
                        ]);
                        historySLVCN::create(
                            [
                                'LSX' => $data->LSX,
                                'itemchild' => $allocate['ItemChild'],
                                'SPDich' => $data->FatherCode,
                                'to' => $data->Team,
                                'quantity' => $allocate['Allocate'],
                                'ObjType' => 202,
                                'DocEntry' => $res['DocEntry']
                            ]
                        );
                        DB::commit();
                    } else {
                        DB::rollBack();
                        return response()->json([
                            'message' => 'Failed receipt',
                            'error' => $res['error'],
                            'body' => $body
                        ], 500);
                    }
                }
                return response()->json('success', 200);
            } else {
                return response()->json([
                    'error' => false,
                    'status_code' => 500,
                    'message' => "Tổ không hợp lệ."
                ], 500);
            }
        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
