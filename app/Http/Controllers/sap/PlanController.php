<?php

namespace App\Http\Controllers\sap;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pallet;
use App\Models\pallet_details;
use App\Models\plandryings;
use App\Models\worker;
use App\Models\plandetail;
use Exception;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use App\Rules\UniqueOvenStatusRule;
use Carbon\Carbon;
use App\Jobs\UpdateProductionOrders;
use App\Jobs\issueProduction;
use App\Jobs\receiptProduction;

class PlanController extends Controller
{
    // tạo kế hoạch sấy
    function pickOven(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'Oven' => ['required', new UniqueOvenStatusRule], // new UniqueOvenStatusRule
                'Reason' => 'required',
                'Method' => 'required',
                'Time' => 'required|integer'
            ]);
            if ($validator->fails()) {
                return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
            }
            $conDB = (new ConnectController)->connect_sap();
            // ghi nhận kế hoạch sấy vào hệ thống app
            DB::beginTransaction();
            $PlanData = $request->only(['Oven', 'Reason', 'Method', 'Time']);
            $PlanData['CreateBy'] = Auth::user()->id;
            // $PlanData['PlanDate'] = Carbon::now()->addDays($request->input('Time'));
            $plandryings = plandryings::create($PlanData);

            // lock lò sấy
            $sql = 'Update  "@G_SAY3" set "U_status"=1 where "Code"=?';
            $stmt = odbc_prepare($conDB, $sql);
            if (!$stmt) {
                throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
            }
            if (!odbc_execute($stmt, [$plandryings->Oven])) {
                throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
            }
            DB::commit();
            odbc_close($conDB);
            return response()->json($plandryings, 200);
        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    // danh sách kế hoạch sấy
    function listPlan(Request $request)
    {
        $pallets = DB::table('planDryings as a')
            ->join('users as b', 'a.CreateBy', '=', 'b.id')
            ->select('a.*')
            ->where('b.plant', '=', Auth::user()->plant)
            ->where('a.Status', '<>', '4')
            ->get();
        return response()->json($pallets, 200);
    }
    //danh sách pallet chưa được assign
    function listpallet(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $pallets = DB::table('pallets as a')
            ->join('users as b', 'a.CreateBy', '=', 'b.id')
            ->leftJoin('plan_detail as c', 'a.palletID', '=', 'c.pallet')
            ->select('a.palletID', 'a.Code')
            ->where('b.plant', '=', Auth::user()->plant)
            ->whereNull('c.pallet');
        if ($request->reason == 'INDOOR') {
            $pallets = $pallets->where('LyDo', 'INDOOR')->orwhere('LyDo', 'XINDOOR')->get();
        } else if ($request->reason == 'OUTDOOR') {
            $pallets = $pallets->where('LyDo', 'OUTDOOR')->orwhere('LyDo', 'XOUTDOOR')->get();
        } else if ($request->reason === 'SU') {
            $pallets = $pallets->where('LyDo', 'SU')->get();
        } else {
            $pallets = $pallets->where('LyDo', 'SL')->get();
        }

        return response()->json($pallets, 200);
    }
    //danh sách mẻ sấy có thể vào lò
    function listovens()
    {
        $pallets = DB::table('planDryings as a')
            ->join('users as b', 'a.CreateBy', '=', 'b.id')
            ->select('a.*')
            ->where('b.plant', '=', Auth::user()->plant)
            ->where('a.Status', 0)
            ->orwhere('a.Status', 1)
            ->get();
        return response()->json($pallets, 200);
    }
    //danh sách mẻ sấy có thể chay lo
    function ListRunOven()
    {
        $pallets = DB::table('planDryings as a')
            ->join('users as b', 'a.CreateBy', '=', 'b.id')
            ->select('a.*')
            ->where('b.plant', '=', Auth::user()->plant)
            ->where('a.Status', 2)
            ->get();
        return response()->json($pallets, 200);
    }
    //danh sách mẻ sấy có thể hoan thanh
    function Listcomplete()
    {
        $pallets = DB::table('planDryings as a')
            ->join('users as b', 'a.CreateBy', '=', 'b.id')
            ->select('a.*')
            ->where('b.plant', '=', Auth::user()->plant)
            ->where('a.Status', 3)
            ->get();
        return response()->json($pallets, 200);
    }
    //vào lò
    function productionBatch(Request $request)
    {
        $id = $request->input('PlanID');
        $pallet = $request->input('PalletID');
        DB::beginTransaction();
        try {
            // Check if the referenced PlanID exists in the plandryings table
            $existingPlan = plandryings::find($id);

            if (!$existingPlan) {
                throw new \Exception('Lò không hợp lệ.');
            }
            plandryings::where('PlanID', $id)->update(
                [
                    'Status' => 1,
                ]
            );
            $data = plandetail::create(['PlanID' => $id, 'pallet' => $pallet, 'size' => 5, 'Qty' => 10, 'Mass' => 10]);
            DB::commit();

            return response()->json([
                'message' => 'successfully',
                [
                    'data' => $existingPlan,
                    'detail' =>  plandetail::where('PlanID', $id)->get()
                ],


            ], 200);
        } catch (\Exception | QueryException $e) {
            DB::rollBack();
            return response()->json([
                'error' => false,
                'status_code' => 500,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    //hoàn thành đánh giá
    function checkOven(Request $request)
    {
        try {
            DB::beginTransaction();
            $validator = Validator::make($request->all(), [
                'PlanID' => ['required',], // new UniqueOvenStatusRule

            ]);
            if ($validator->fails()) {
                return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
            }
            $id = $request->input('PlanID');
            $record = plandryings::find($id);
            if ($record) {
                $record->update(
                    [
                        'Status' => 2,
                        'Checked' => 1,
                        'Review' => 1,
                        'CheckedBy' => Auth::user()->id
                    ]
                );
                $body = [
                    "ProductionOrderStatus" => "boposReleased"
                ];
                // Fetch data for API request
                $data = DB::table('plan_detail as a')
                    ->join('pallets as b', 'a.pallet', '=', 'b.palletID')
                    ->select('DocEntry', 'pallet')
                    ->where('PlanID', $id)
                    ->distinct()
                    ->get();
                //update hàng loạt lệnh production orders sang plan
                foreach ($data as $entry) {
                    Pallet::where('palletID', $entry->pallet)->update(['flag' => 1]);
                    UpdateProductionOrders::dispatch($entry->DocEntry, $entry->pallet);
                }
                DB::commit();
                return response()->json(['message' => 'updated successfully', 'data' => $record]);
            } else {
                return response()->json(['error' => 'Record not found'], 404);
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
    //chạy lò
    function runOven(Request $request)
    {
        try {
            DB::beginTransaction();
            $validator = Validator::make($request->all(), [
                'PlanID' => ['required',], // new UniqueOvenStatusRule

            ]);
            if ($validator->fails()) {
                return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
            }
            $id = $request->input('PlanID');
            $record = plandryings::find($id);
            if ($record) {
                $record->update(
                    [
                        'Status' => 3,
                        'RunBy' => Auth::user()->id
                    ]
                );

                $results = Plandryings::select(
                    'planDryings.Code as newbatch',
                    'pallets.DocEntry',
                    'pallet_details.ItemCode',
                    'pallet_details.WhsCode',
                    'pallet_details.Qty',
                    'pallet_details.CDai',
                    'pallet_details.CRong',
                    'pallet_details.CDay',
                    'pallet_details.BatchNum',
                    DB::raw('SUM(pallet_details.Qty) OVER (PARTITION BY pallets.palletID) AS TotalQty'),
                    'pallet_details.palletID'
                )
                    ->join('plan_detail', 'planDryings.PlanID', '=', 'plan_detail.PlanID')
                    ->join('pallets', 'plan_detail.pallet', '=', 'pallets.palletID')
                    ->join('pallet_details', 'pallets.palletID', '=', 'pallet_details.palletID')
                    ->where('planDryings.PlanID', $id)
                    ->get();

                $groupedResults = $results->groupBy('DocEntry');

                foreach ($groupedResults as $docEntry => $group) {
                    $data = [];
                    foreach ($group as $batchData) {
                        $data[] = [
                            "BatchNumber" => $batchData->BatchNum,
                            "Quantity" => $batchData->Qty,
                            "ItemCode" => $batchData->ItemCode,
                        ];
                    }

                    $header = $group->first();

                    $body = [
                        "DocumentLines" => [
                            [
                                "Quantity" => $header->TotalQty,
                                "BaseLine" => 0,
                                "WarehouseCode" => $header->WhsCode,
                                "BaseEntry" => $header->DocEntry,
                                "BaseType" => 202,
                                "BatchNumbers" => $data,
                            ],
                        ],
                    ];


                    issueProduction::dispatch($body);
                }

                DB::commit();
                return response()->json(['message' => 'updated successfully', 'data' => $record]);
            } else {
                return response()->json(['error' => 'Record not found'], 404);
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
    //ra lò
    function completed(Request $request)
    {
        try {
            DB::beginTransaction();
            $validator = Validator::make($request->all(), [
                'PlanID' => ['required',], // new UniqueOvenStatusRule

            ]);
            if ($validator->fails()) {
                return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
            }
            $id = $request->input('PlanID');
            $record = plandryings::find($id);
            if ($record) {
                $record->update(
                    [
                        'Status' => 4,
                        'CompletedBy' => Auth::user()->id
                    ]
                );
                $results = Plandryings::select(
                    'planDryings.Code as newbatch',
                    'planDryings.Oven',
                    'pallets.DocEntry',
                    'pallet_details.ItemCode',
                    'pallet_details.WhsCode',
                    'pallet_details.Qty',
                    'pallet_details.CDai',
                    'pallet_details.CRong',
                    'pallet_details.CDay',
                    'pallet_details.BatchNum',
                    DB::raw('SUM(pallet_details.Qty) OVER (PARTITION BY pallets.palletID) AS TotalQty'),
                    'pallet_details.palletID'
                )
                    ->join('plan_detail', 'planDryings.PlanID', '=', 'plan_detail.PlanID')
                    ->join('pallets', 'plan_detail.pallet', '=', 'pallets.palletID')
                    ->join('pallet_details', 'pallets.palletID', '=', 'pallet_details.palletID')
                    ->where('planDryings.PlanID', $id)
                    ->get();

                $groupedResults = $results->groupBy('DocEntry');

                $test = [];
                foreach ($groupedResults as $docEntry => $group) {
                    $data = [];
                    foreach ($group as $batchData) {
                        $data[] = [
                            "BatchNumber" => $batchData->newbatch,
                            "Quantity" => $batchData->Qty,
                            "ItemCode" => $batchData->ItemCode,
                            "U_CDai" => $batchData->CDai,
                            "U_CRong" =>  $batchData->CRong,
                            "U_CDay" =>  $batchData->CDay,
                        ];
                    }

                    $header = $group->first();

                    $body = [
                        "DocumentLines" => [
                            [
                                "Quantity" => $header->TotalQty,
                                "BaseLine" => 0,
                                "WarehouseCode" => $header->WhsCode,
                                "BaseEntry" => $header->DocEntry,
                                "BaseType" => 202,
                                "BatchNumbers" => $data,
                            ],
                        ],
                    ];

                    $test[] = $body;
                    receiptProduction::dispatch($body);
                }
                // ulock lò sấy
                $conDB = (new ConnectController)->connect_sap();
                $sql = 'Update  "@G_SAY3" set "U_status"=0 where "Code"=?';
                $stmt = odbc_prepare($conDB, $sql);
                if (!$stmt) {
                    throw new \Exception('Error preparing SQL statement: ' . odbc_errormsg($conDB));
                }
                if (!odbc_execute($stmt, [$results->first()->Oven])) {
                    throw new \Exception('Error executing SQL statement: ' . odbc_errormsg($conDB));
                }
                DB::commit();
                return response()->json(['message' => 'updated successfully', 'data' => $record]);
            } else {
                return response()->json(['error' => 'Record not found'], 404);
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
    // chi tiết mẻ
    function productionDetail($id)
    {

        // Assuming Plandryings is your model for the plandryings table
        $plandrying = Plandryings::with('details')
            ->where('PlanID', $id)
            ->first();

        if ($plandrying) {
            // Access the related plan details
            $planDetails = $plandrying->details;
            return response()->json(['plandrying' => $plandrying]);
        } else {
            return response()->json(['error' => 'No record found for the given PlanID'], 404);
        }
    }
}
