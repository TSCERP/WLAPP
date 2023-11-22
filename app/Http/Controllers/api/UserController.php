<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/users",
     *     tags={"MasterData"},
     *     summary="Get all list users",
     *     @OA\Response(
     *         response=200,
     *         description="successful operation",
     *         @OA\JsonContent(
     *            @OA\Property(
     *                  property="first_name",
     *                  type="string",
     *                  example="Judd Leuschke"
     *              ),
     *              @OA\Property(
     *                  property="email",
     *                  type="string",
     *                  example="mortimer45@example.org"
     *              ),
     *  *              @OA\Property(
     *                  property="plant",
     *                  type="string",
     *                  example="TQ"
     *              ),
     *  *              @OA\Property(
     *                  property="sap_id",
     *                  type="string",
     *                  example="manager"
     *              )
     *         )
     *     ),
     *     security={
     *         {"api_key": {}}
     *     }
     * )
     */
    // function index(Request $request)
    // {
    //     $pagination = User::orderBy('id', 'DESC')->paginate(20);

    //     // Get the array representation of the pagination data
    //     $response = $pagination->toArray();

    //     // Manually add the next page link if it exists
    //     $response['next_page_url'] = $pagination->nextPageUrl();
    //     $response['prev_page_url'] = $pagination->previousPageUrl();

    //     return response()->json($response, 200);
    // }
    function index(Request $request)
    {
        $users = User::orderBy('id', 'DESC')->get();

        return response()->json($users, 200);
    }
    // xem chi tiết thông tin user theo id
    function UserById($id)
    {
        try {
            $user = User::findOrFail($id);
            $roles = Role::pluck('name', 'name')->all();
            $userRole = $user->getRoleNames();

            if ($user->avatar) {
                $user->avatar = asset('storage/' . $user->avatar);
            }

            return response()->json(['user' => $user, 'UserRole' => $userRole, 'role' => $roles], 200);
        } catch (ModelNotFoundException $e) {
            // Trả về một response lỗi khi không tìm thấy user
            return response()->json(['error' => 'User not found'], 404);
        }
    }
    /**
     * @OA\Get(
     *     path="/api/users/block/{userId}",
     *     tags={"MasterData"},
     *     summary="Get detail user by id",
     *     @OA\Parameter(
     *         name="userId",
     *         in="path",
     *         description="ID of user that needs to be fetched",
     *         required=true,
     *         @OA\Schema(
     *             type="integer",
     *             format="int64",
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="successful operation",
     *     ),
     *     security={
     *         {"api_key": {}}
     *     }
     * )
     */
    function blockUser($id)
    {
        $user = User::find($id);
    
        if ($user) {
            $user->is_block = $user->is_block == 1 ? 0 : 1;
            $user->save();
    
            return response()->json(['message' => 'Update successfully'], 200);
        }
    
        return response()->json(['error' => 'User not found'], 404);
    }
    /**
     * @OA\post(
     *     path="/api/users/create",
     *     tags={"MasterData"},
     *     summary="Create users",
     *     @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"first_name","last_name","email","password","confirm-password","plant","sap_id","role"},
     *              @OA\Property(
     *                  property="first_name",
     *                  type="string",
     *                  format="text",
     *                  description="The first_name of the user",
     *                  example="Tony"
     *              ),
     *              @OA\Property(
     *                  property="last_name",
     *                  type="string",
     *                  format="text",
     *                  description="The last_name of the user",
     *                  example="john"
     *              ),
     *              @OA\Property(
     *                  property="plant",
     *                  type="string",
     *                  format="text",
     *                  description="The plant of the user",
     *                  example="TQ"
     *              ),
     *              @OA\Property(
     *                  property="email",
     *                  type="string",
     *                  format="email",
     *                  description="The email of the user",
     *                  example="user@example.com"
     *              ),
     *              @OA\Property(
     *                  property="confirm-password",
     *                  type="string",
     *                  format="password",
     *                  description="The confirm-password of the user",
     *                  example="password1234"
     *              ),
     *              @OA\Property(
     *                  property="password",
     *                  type="string",
     *                  format="password",
     *                  description="The password of the user",
     *                  example="password1234"
     *              )
     *          )
     *      ),
     *     @OA\Response(
     *         response=200,
     *         description="successful operation",
     *         @OA\JsonContent(
     *            @OA\Property(
     *                  property="first_name",
     *                  type="string",
     *                  example="Judd Leuschke"
     *              ),
     *              @OA\Property(
     *                  property="email",
     *                  type="string",
     *                  example="mortimer45@example.org"
     *              ),
     *  *              @OA\Property(
     *                  property="plant",
     *                  type="string",
     *                  example="TQ"
     *              ),
     *  *              @OA\Property(
     *                  property="sap_id",
     *                  type="string",
     *                  example="manager"
     *              )
     *         )
     *     ),
     *     security={
     *         {"api_key": {}}
     *     }
     * )
     */
    function create(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'first_name' => 'required',
            'last_name' => 'required',
            'gender' => 'required',
            'email' => 'required|email|unique:users,email',
            'password' => 'required',
            'plant' => 'required',
            'sap_id' => 'required|unique:users,sap_id',
            'integration_id' => 'required|unique:users,integration_id',
            'roles' => 'required|exists:roles,name',
            'branch' => 'required',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Check if validation fails
        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }

        // Get validated data
        $input = $validator->validated();
        $input = $request->all();
        $input['password'] = Hash::make($input['password']);

        $user = User::create($input);
        $user->assignRole([$request->input('roles')]);

        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $avatarPath = $avatar->storeAs('public/avatars/' . $user->id, $avatar->getClientOriginalName());

            $avatarPathWithoutPublic = str_replace('public/', '', $avatarPath);
            $user->avatar = $avatarPathWithoutPublic;
            $user->save();
        }

        // Return a successful response
        return response()->json(['message' => 'User created successfully', 'user' => $user], 200); // 20 Created status code
    }
    function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable',
            'plant' => 'required',
            'sap_id' => 'required|unique:users,sap_id,' . $id,
            'roles' => 'required',
            'branch' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => implode(' ', $validator->errors()->all())], 422); // Return validation errors with a 422 Unprocessable Entity status code
        }

        $input = $request->all();

        if (!empty($input['password'])) {
            $input['password'] = Hash::make($input['password']);
        } else {
            $input = Arr::except($input, array('password'));
        }

        $user = User::find($id);

        
        if ($request->has('avatar')) {
            if ($request->avatar == '-1') {
                // Delete avatar file and set avatar field to null
                if ($user->avatar) {
                    Storage::delete('public/' . $user->avatar);
                    $input['avatar'] = null;
                }
            } elseif ($request->hasFile('avatar')) {
                // Delete old avatar file
                if ($user->avatar) {
                    Storage::delete('public/' . $user->avatar);
                }
        
                // Upload new avatar file
                $avatar = $request->file('avatar');
                $avatarPath = $avatar->storeAs('public/avatars/' . $user->id, $avatar->getClientOriginalName());
        
                $avatarPathWithoutPublic = str_replace('public/', '', $avatarPath);
                $input['avatar'] = $avatarPathWithoutPublic;
            }
        }

        unset($input['_method']);

        $user->update($input);

        DB::table('model_has_roles')->where('model_id', $id)->delete();

        $user->assignRole([$request->input('roles')]);

        return response()->json(['message' => 'User updated successfully', 'user' => $user], 200);
    }
    public function delete($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $avatarPath = 'public/avatars/' . $user->id;

        if (Storage::exists($avatarPath)) {
            Storage::deleteDirectory($avatarPath);
        }

        DB::table('model_has_roles')->where('model_id', $id)->delete();

        // Xóa người dùng
        $user->delete();

        return response()->json(['message' => 'User deleted successfully'], 200);
    }
}