<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;

class RolesController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    function __construct()
    {
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    // public function index(Request $request)
    // {
    //     $pagination = Role::orderBy('id', 'DESC')->paginate(20);
    //     // Get the array representation of the pagination data
    //     $response = $pagination->toArray();
    //     // Manually add the next page link if it exists
    //     $response['next_page_url'] = $pagination->nextPageUrl();
    //     $response['prev_page_url'] = $pagination->previousPageUrl();

    //     return response()->json($response, 200);
    // }
    function index(Request $request)
    {
        $users = Role::orderBy('id', 'DESC')->get();

        return response()->json($users, 200);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'name' => 'required|unique:roles,name',
            'permission' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }
        $role = Role::create(['name' => $request->get('name'), 'guard_name' => 'web']);

        $role->syncPermissions($request->get('permission'));
        return response()->json(['message' => 'Role created successfully', 'user' => $role], 200);
    }
    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required',
            'permission' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422);
        }

        $role->update(['name' => $request->name]);


        $permissions = $request->permission; 

        $existingPermissions = Permission::whereIn('name', $permissions)->pluck('name');

        $role->syncPermissions($existingPermissions);

        // Trả về thông báo thành công
        return response()->json(['message' => 'Role updated successfully', 'user' => $role], 200);
    }

    public function detail($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['error' => 'Role not found'], 404);
        }

        $allpermissions = Permission::select('id', 'name')->orderBy('id', 'asc')->get();
        
        $rolePermissions = [
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name')->toArray()
        ];

        
        return response()->json(['details' => $rolePermissions, 'allPermission' => $allpermissions], 200);
    }

    // Delete roles
    public function delete($id)
    {
        $role = Role::findOrFail($id);
        DB::table('role_has_permissions')->where('role_id', $id)->delete();
        $role->delete();

        return response()->json(['message' => 'Role deleted successfully'], 200);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Role $role)
    {
        $role->delete();
        return response()->json(['message' => 'Role deleted successfully', 'user' => $role], 200);
    }
}
