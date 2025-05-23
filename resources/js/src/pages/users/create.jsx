import React, { useState, useEffect, useRef, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import { MdDeleteOutline } from "react-icons/md";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import toast from "react-hot-toast";
import useAppContext from "../../store/AppContext";
import Layout from "../../layouts/layout";
import Loader from "../../components/Loader";
import DefaultAvatar from "../../assets/images/Default-Avatar.png";
import generateAvatar from "../../utils/generateAvatar";
import usersApi from "../../api/userApi";
import roleApi from "../../api/roleApi";
import TinyLoader from "../../components/TinyLoader";
import { IoMdArrowRoundBack } from "react-icons/io";
import { RiEyeFill, RiEyeOffFill } from "react-icons/ri";

const genderOptions = [
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
];

// const authorizationOptions = [
//     { value: "admin", label: "Admin" },
//     { value: "client", label: "Client" },
// ];

const validationSchema = Yup.object().shape({
    lastName: Yup.string()
        .matches(/^[\p{L} ]+$/u, "Chỉ cho phép chữ cái và khoảng trắng")
        .max(30, "Họ không được quá 30 kí tự")
        .required("Họ là bắt buộc"),
    firstName: Yup.string()
        .matches(/^[\p{L} ]+$/u, "Chỉ cho phép chữ cái và khoảng trắng")
        .max(30, "Tên không được quá 30 kí tự")
        .required("Tên là bắt buộc"),
    // email: Yup.string()
    //     .email("Email không hợp lệ")
    //     .required("Email là bắt buộc"),
    // gender: Yup.string()
    //     .oneOf(["male", "female"], "Giá trị không hợp lệ")
    //     .required("Giới tính là bắt buộc"),
    password: Yup.string()
        .required("Mật khẩu là bắt buộc")
        .test("uppercase", "Mật khẩu cần có ít nhất 1 kí tự in hoa", (value) =>
            /[A-Z]/.test(value)
        )
        .test(
            "lowercase",
            "Mật khẩu cần có ít nhất 1 kí tự viết thường",
            (value) => /[a-z]/.test(value)
        )
        .test("digit", "Mật khẩu cần có ít nhất 1 chữ số", (value) =>
            /\d/.test(value)
        )
        .test(
            "specialChar",
            "Mật khẩu cần có ít nhất 1 kí tự đặc biệt",
            (value) => /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value)
        )
        .test(
            "length",
            "Mật khẩu phải có từ 8 - 15 ký tự",
            (value) => value && value.length >= 8 && value.length <= 15
        ),
    authorization: Yup.string().required("Phân quyền là bắt buộc"),
    sapId: Yup.string().required("SAP ID là bắt buộc"),
    username: Yup.string().required("Username là bắt buộc"),
    // integrationId: Yup.string().required("Integration ID là bắt buộc"),
    factory: Yup.string().required("Nhà máy là bắt buộc"),
    branch: Yup.string().required("Chi nhánh là bắt buộc"),
});

const SelectField = forwardRef(
    ({ options, name, setInput, innerRef, ...props }, ref) => {
        const [selectedOption, setSelectedOption] = useState();
        const { setFieldValue } = useFormikContext();

        const handleChange = (option) => {
            setSelectedOption(option);
            setFieldValue(name, option?.value || "");
            setInput((prev) => ({
                ...prev,
                [name]: option?.value || "",
            }));
        };

        return (
            <Select
                {...props}
                ref={innerRef || ref}
                options={options}
                value={selectedOption}
                onChange={handleChange}
                placeholder="Lựa chọn"
            />
        );
    }
);

const AsyncSelectField = forwardRef(
    ({ options, loadOptions, name, setInput, innerRef, ...props }, ref) => {
        const [selectedOption, setSelectedOption] = useState();
        const { setFieldValue } = useFormikContext();

        const handleChange = (option) => {
            setSelectedOption(option);
            setFieldValue(name, option.value);
            setInput((prev) => ({
                ...prev,
                [name]: option.value,
            }));
        };

        return (
            <AsyncSelect
                {...props}
                ref={innerRef || ref}
                cacheOptions
                defaultOptions
                loadOptions={loadOptions}
                value={selectedOption}
                options={options}
                placeholder="Lựa chọn"
                onChange={handleChange}
            />
        );
    }
);

const animatedComponents = makeAnimated();

const AsyncMultiSelectField = forwardRef(
    ({ loadOptions, name, setInput, innerRef, ...props }, ref) => {
        const [selectedOption, setSelectedOption] = useState();
        const { setFieldValue } = useFormikContext();

        const handleChange = (option) => {
            setSelectedOption(option);
            setFieldValue(name, option ? option.map((opt) => opt.label) : []);
            setInput((prev) => ({
                ...prev,
                [name]: option ? option.map((opt) => opt.label) : [],
            }));
        };

        return (
            <AsyncSelect
                {...props}
                ref={innerRef || ref}
                cacheOptions
                defaultOptions
                loadOptions={loadOptions}
                value={selectedOption}
                onChange={handleChange}
                components={animatedComponents}
                closeMenuOnSelect={false}
                isMulti
                placeholder="Lựa chọn"
            />
        );
    }
);

function CreateUser() {
    const navigate = useNavigate();

    const fileInputRef = useRef(null);

    // const authorizationInputRef = React.createRef();;
    // const branchSelectRef = React.createRef();;
    // const sapIdSelectRef = React.createRef();;
    // const factorySelectRef = React.createRef();;

    const authorizationInputRef = useRef(null);
    const branchSelectRef = useRef(null);
    const sapIdSelectRef = useRef(null);
    const factorySelectRef = useRef(null);

    const { loading, setLoading } = useAppContext();

    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [sapId, setSapId] = useState([]);
    const [factoryLoading, setFactoryLoading] = useState(false);
    const [factories, setFactories] = useState([]);
    const [avatar, setAvatar] = useState({
        file: null,
        imgSrc: DefaultAvatar,
        autoImg: null,
    });
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [input, setInput] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        gender: "0",
        password: "",
        authorization: "",
        sapId: "",
        integrationId: 1,
        factory: "",
        branch: "",
    });
    const [signature, setSignature] = useState(null);
    const [previewSignature, setPreviewSignature] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleChangeAvatar = (event) => {
        setAvatarLoading(true);
        const file = event.target.files[0];
        setSelectedFile(file);
        const reader = new FileReader();

        reader.onload = (event) => {
            const imgSrc = event.target.result;
            setAvatar({
                ...avatar,
                file: file,
                imgSrc: imgSrc,
            });
        };

        reader.readAsDataURL(file);
        setAvatarLoading(false);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles, rejectedFiles) => {
            if (rejectedFiles && rejectedFiles.length > 0) {
                toast.error("Chỉ được upload file hình ảnh");
            } else {
                const imageFile = acceptedFiles[0];
                // Kiểm tra kích thước
                if (imageFile.size > 2 * 1024 * 1024) {
                    toast.error("Vui lòng chọn hình có kích thước <= 2MB.");
                    return;
                }
                setSignature(imageFile);
                const reader = new FileReader();
                reader.onload = () => {
                    const previewUrl = reader.result;
                    setPreviewSignature(previewUrl);
                };
                reader.readAsDataURL(imageFile);
            }
        },
        accept: "image/*",
        multiple: false,
    });

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(",")[1];
                resolve(base64String);
            };
            reader.onerror = () => {
                reject(new Error("Chuyển đổi Blob thành Base64 thất bại."));
            };
            reader.readAsDataURL(blob);
        });
    };

    const handleDeleteAvatar = () => {
        setAvatarLoading(true);
        setAvatar({
            ...avatar,
            file: null,
            imgSrc: DefaultAvatar,
        });
        setAvatarLoading(false);
    };

    const handleFormSubmit = async (values) => {
        console.log(values);
        setLoading(true);
        const userData = values;
        if (selectedFile) {
            userData.avatar = selectedFile;
        }
        try {
            const res = await usersApi.createUser(userData);
            // if (res && res.status === 200) {
            console.log(res);
            toast.success("Tạo user thành công.");
            navigate(`/user/${res.user.id}`);
            // } else {
            // toast.error("Có lỗi khi tạo user.");
            // }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);

        // console.log("Submit form nè: ", input);
    };

    const loadBranches = (inputValue, callback) => {
        usersApi
            .getAllBranches()
            .then((data) => {
                const filteredOptions = data.filter((option) => {
                    return (
                        option.BPLName?.toLowerCase().includes(
                            inputValue.toLowerCase()
                        ) ||
                        option.BPLId?.toLowerCase().includes(
                            inputValue.toLowerCase()
                        )
                    );
                });

                const asyncOptions = filteredOptions.map((item) => ({
                    value: item.BPLId,
                    label: item.BPLName,
                }));

                callback(asyncOptions);
            })
            .catch((error) => {
                console.error("Error fetching branch:", error);
                callback([]);
            });
    };

    const loadRoles = (inputValue, callback) => {
        roleApi
            .getAllRole()
            .then((data) => {
                const filteredOptions = data.filter((option) => {
                    return (
                        option.name
                            ?.toLowerCase()
                            .includes(inputValue.toLowerCase()) ||
                        option.id
                            ?.toLowerCase()
                            .includes(inputValue.toLowerCase())
                    );
                });

                const asyncOptions = filteredOptions.map((item) => ({
                    value: item.id,
                    label:
                        item.name.charAt(0).toUpperCase() + item.name.slice(1),
                }));

                callback(asyncOptions);
            })
            .catch((error) => {
                console.error("Error fetching roles:", error);
                callback([]);
            });
    };

    const loadSapId = (inputValue, callback) => {
        usersApi
            .getAllSapId()
            .then((data) => {
                const filteredOptions = data.filter((option) => {
                    return (
                        option.NAME?.toLowerCase().includes(
                            inputValue.toLowerCase()
                        ) ||
                        option.USER_CODE?.toLowerCase().includes(
                            inputValue.toLowerCase()
                        )
                    );
                });

                const asyncOptions = filteredOptions.map((item) => ({
                    value: item.USER_CODE,
                    label: item.NAME + " - " + item.USER_CODE,
                }));

                callback(asyncOptions);
            })
            .catch((error) => {
                console.error("Error fetching sap id:", error);
                callback([]);
            });
    };

    const loadFactories = (inputValue, callback) => {
        const selectedBranchId = input.branch;

        if (!selectedBranchId) {
            setFactories([]);
            return;
        }

        usersApi
            .getFactoriesByBranchId(selectedBranchId)
            .then((data) => {
                let filteredOptions = data;
                // if (inputValue) {
                //     console.log("Vào filter khum: ", inputValue);
                //     filteredOptions = data.filter((option) => {
                //         return (
                //             option.Name
                //                 ?.toLowerCase()
                //                 .includes(inputValue.toLowerCase().trim()) ||
                //             option.Code
                //                 ?.toLowerCase()
                //                 .includes(inputValue.toLowerCase().trim())
                //         );
                //     });
                // }

                const asyncOptions = filteredOptions.map((item) => ({
                    value: item.Code,
                    label: item.Name,
                }));

                console.log("Factories nè: ", asyncOptions);

                callback(asyncOptions);
            })
            .catch((error) => {
                console.error("Error fetching factory:", error);
                callback([]);
            });
    };

    useEffect(() => {
        const getAutoAvatar = async (name) => {
            try {
                const res = await generateAvatar(name);
                const base64 = await blobToBase64(res);
                const imgSrc = `data:image/png;base64,${base64}`;
                setAvatar({ ...avatar, imgSrc: null, autoImg: imgSrc });
            } catch (error) {
                console.error(error);
            }
        };

        if (input.lastName && input.firstName && !avatar.file) {
            const tempName =
                input.lastName.trim().charAt(0) +
                input.firstName.trim().charAt(0);
            getAutoAvatar(tempName);
        }
    }, [input]);

    useEffect(() => {
        const getAllBranches = async () => {
            try {
                const res = await usersApi.getAllBranches();
                const options = res.map((item) => ({
                    value: item.BPLId,
                    label: item.BPLName,
                }));
                setBranches(options);
                // console.log("Ra chi nhánh nè: ", options);
            } catch (error) {
                console.error(error);
            }
        };

        const getAllRoles = async () => {
            try {
                const res = await roleApi.getAllRole();
                const options = res.map((item) => ({
                    value: item.id,
                    label:
                        item.name.charAt(0).toUpperCase() + item.name.slice(1),
                }));
                setRoles(options);
                // console.log("Ra role nè: ", options);
            } catch (error) {
                console.error(error);
            }
        };

        const getAllSapId = async () => {
            try {
                const res = await usersApi.getAllSapId();
                const options = res.map((item) => ({
                    value: item.USER_CODE,
                    label: item.NAME + " - " + item.USER_CODE,
                }));
                setSapId(options);
                // console.log("Ra sap id nè: ", options);
            } catch (error) {
                console.error(error);
            }
        };

        getAllBranches();
        getAllRoles();
        getAllSapId();
        document.title = "Woodsland - Tạo mới người dùng";
        return () => {
            document.title = "Woodsland";
            document.body.classList.remove("body-no-scroll");
        };
    }, []);

    useEffect(() => {
        const selectedBranch = input.branch;

        const getFactoriesByBranchId = async () => {
            setFactoryLoading(true);
            try {
                if (selectedBranch) {
                    setFactories([]);
                    factorySelectRef.current.clearValue();
                    const res = await usersApi.getFactoriesByBranchId(
                        selectedBranch
                    );
                    const options = res.map((item) => ({
                        value: item.Code,
                        label: item.Name,
                    }));

                    setFactories(options);
                    setInput((prev) => ({ ...prev, factory: "" }));
                } else {
                    setFactories([]);
                    // factorySelectRef.current?.selectOption([]);
                }
            } catch (error) {
                console.error(error);
            }
            setFactoryLoading(false);
        };

        // console.log("Chỗ này call api nè: ", factorySelectRef.current);
        getFactoriesByBranchId();
    }, [input.branch]);

    useEffect(() => {
        if (loading) {
            document.body.classList.add("body-no-scroll");
        } else {
            document.body.classList.remove("body-no-scroll");
        }
    }, [loading]);

    return (
        <Layout>
            <div className="flex justify-center bg-transparent">
                {/* Section */}
                <div className="w-screen xl:p-12 xl:pt-6 p-4 px-5 xl:px-32 border-t border-gray-200">
                    {/* Go back */}
                    <div
                        className="flex items-center space-x-1 bg-[#DFDFE6] hover:cursor-pointer active:scale-[.95] active:duration-75 transition-all rounded-2xl p-1 w-fit px-3 mb-3 text-sm font-medium text-[#17506B] xl:ml-0 lg:ml-0 md:ml-0 ml-4"
                        onClick={() => navigate(-1)}
                    >
                        <IoMdArrowRoundBack />
                        <div>Quay lại</div>
                    </div>

                    {/* Header */}
                    <div className="serif text-4xl font-bold mb-4">
                        Tạo mới người dùng
                    </div>

                    {/* Main content */}
                    <Formik
                        initialValues={input}
                        validationSchema={validationSchema}
                        onSubmit={(values) => handleFormSubmit(values)}
                    >
                        {({ errors, touched, values, setFieldValue }) => {
                            return (
                                <div className="pb-8 ">
                                    <Form className="flex flex-col p-6 bg-white border-2 border-gray-200 rounded-xl">
                                        <h1 className="mb-2 serif text-2xl text-center font-bold md:text-left">
                                            Thông tin cơ bản
                                        </h1>
                                        <section className="flex flex-col-reverse md:flex-row md:gap-4">
                                            <div className="md:w-2/3 mb-4">
                                                <div className="flex flex-col md:grid md:grid-cols-2 gap-x-4">
                                                    <div className="w-full">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            Họ{" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </label>
                                                        <Field
                                                            name="lastName"
                                                            className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                            onChange={(e) => {
                                                                setFieldValue(
                                                                    "lastName",
                                                                    e.target
                                                                        .value
                                                                );
                                                                setInput(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        lastName:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                        {errors.lastName &&
                                                        touched.lastName ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="lastName" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                    <div className="w-full">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            Tên{" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </label>
                                                        <Field
                                                            name="firstName"
                                                            className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                            onChange={(e) => {
                                                                setFieldValue(
                                                                    "firstName",
                                                                    e.target
                                                                        .value
                                                                );
                                                                setInput(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        firstName:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                        {errors.firstName &&
                                                        touched.firstName ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="firstName" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                    <div className="w-full">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            Email{" "}
                                                        </label>
                                                        <Field
                                                            name="email"
                                                            type="email"
                                                            className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                            onChange={(e) => {
                                                                setFieldValue(
                                                                    "email",
                                                                    e.target
                                                                        .value
                                                                );
                                                                setInput(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        email: e
                                                                            .target
                                                                            .value,
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                        {errors.email &&
                                                        touched.email ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="email" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                    <div className="w-full">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            UserName(MãNv){" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </label>
                                                        <Field
                                                            name="username"
                                                            type="text"
                                                            className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                            onChange={(e) => {
                                                                setFieldValue(
                                                                    "username",
                                                                    e.target
                                                                        .value
                                                                );
                                                                setInput(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        username:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                        {errors.username &&
                                                        touched.username ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="username" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                    <div className="w-full">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            Giới tính{" "}
                                                        </label>
                                                        <SelectField
                                                            name="gender"
                                                            options={
                                                                genderOptions
                                                            }
                                                            setInput={setInput}
                                                        />
                                                        {errors.gender &&
                                                        touched.gender ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="gender" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                    <div className="w-full relative">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            Mật khẩu{" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </label>
                                                        <Field
                                                            name="password"
                                                            type={
                                                                showPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                            onChange={(e) => {
                                                                setFieldValue(
                                                                    "password",
                                                                    e.target
                                                                        .value
                                                                );
                                                                setInput(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        password:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                        <div
                                                            className="absolute top-[40px] right-3 cursor-pointer text-gray-600"
                                                            onClick={
                                                                toggleShowPassword
                                                            }
                                                        >
                                                            {showPassword ? (
                                                                <RiEyeOffFill
                                                                    size={20}
                                                                    className="text-gray-500"
                                                                />
                                                            ) : (
                                                                <RiEyeFill
                                                                    size={20}
                                                                    className="text-gray-500"
                                                                />
                                                            )}
                                                        </div>
                                                        {errors.password &&
                                                        touched.password ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="password" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                    <div className="w-full">
                                                        <label className="block mb-2 text-md font-medium text-gray-900">
                                                            Vai trò{" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </label>
                                                        <SelectField
                                                            name="authorization"
                                                            placeholder="Chọn vai trò"
                                                            ref={
                                                                authorizationInputRef
                                                            }
                                                            // isMulti
                                                            options={roles}
                                                            setInput={setInput}
                                                            value={
                                                                values.authorization
                                                            }
                                                        />
                                                        {/* <AsyncMultiSelectField
                                                            ref={authorizationInputRef}
                                                            name="authorization"
                                                            loadOptions={
                                                                loadRoles
                                                            }
                                                            options={roles}
                                                            setInput={setInput}
                                                        /> */}
                                                        {errors.authorization &&
                                                        touched.authorization ? (
                                                            <span className="text-xs text-red-600">
                                                                <ErrorMessage name="authorization" />
                                                            </span>
                                                        ) : (
                                                            <span className="block mt-[8px] h-[14.55px]"></span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* <div
                                                    className="p-4 cursor-pointer border-dashed rounded-md border-2 border-sky-500 my-4"
                                                    {...getRootProps()}
                                                >
                                                    <input
                                                        {...getInputProps()}
                                                    />
                                                    {isDragActive ? (
                                                        <p className="py-4">
                                                            Thả hình ảnh tại đây
                                                            ...
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <div className="flex flex-col md:flex-row items-center gap-1">
                                                                <span className="sm:block hidden">
                                                                    Kéo và thả
                                                                    hình ảnh chữ
                                                                    ký vào đây,
                                                                    hoặc
                                                                </span>
                                                                <span className="sm:hidden">Upload chữ ký</span>
                                                                <span class="rounded-lg cursor-pointer px-2 py-1 text-white bg-[#155979] hover:bg-[#1A6D94] duration-300">
                                                                    chọn từ file
                                                                </span>
                                                            </div>
                                                            <span className="text-[12px] text-center w-full mt-4 sm:text-left md:text-sm text-red-600">
                                                                Lưu ý: Tỉ lệ ảnh nên là 1:1 và ≤ 2MB
                                                            </span>
                                                        </>
                                                    )}
                                                </div> */}
                                                {/* {previewSignature && (
                                                    <div>
                                                        <div className="relative w-fit mx-auto">
                                                            <img
                                                                className="mt-2 h-[200px] w-[200px] object-contain shadow-xl rounded"
                                                                src={
                                                                    previewSignature
                                                                }
                                                                alt="Signature-preview"
                                                            />
                                                            <span onClick={handleDeleteSignature} className="cursor-pointer absolute top-3 right-2 z-10">
                                                                <TiDeleteOutline className="text-2xl text-red-600" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                )} */}
                                            </div>
                                            <div className="flex flex-col justify-center items-center md:w-1/3 mb-4">
                                                <span className="mb-4">
                                                    Ảnh đại diện
                                                </span>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    name="Avatar"
                                                    id="avatar"
                                                    onChange={
                                                        handleChangeAvatar
                                                    }
                                                    className="hidden"
                                                />
                                                <figure className="w-1/2 relative aspect-square mb-4 rounded-full object-cover border-2 border-solid border-indigo-200 p-1">
                                                    <img
                                                        id="avatar-display"
                                                        src={
                                                            (avatar.imgSrc ==
                                                                DefaultAvatar &&
                                                            avatar.autoImg
                                                                ? avatar.autoImg
                                                                : avatar.imgSrc) ||
                                                            avatar.autoImg
                                                        }
                                                        className="w-full aspect-square rounded-full object-cover self-center"
                                                        alt="Default-Avatar"
                                                    />
                                                    {avatarLoading && (
                                                        <>
                                                            <div className="absolute aspect-square rounded-full top-0 left-0 w-full h-full bg-black opacity-40"></div>
                                                            <TinyLoader className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                        </>
                                                    )}
                                                </figure>
                                                {/* <img
                                                id="avatar-display"
                                                src={
                                                    (avatar.imgSrc == DefaultAvatar && avatar.autoImg ? avatar.autoImg : avatar.imgSrc) ||
                                                    avatar.autoImg
                                                }
                                                className="w-1/2 aspect-square mb-4 rounded-full object-cover"
                                                alt="Default-Avatar"
                                            /> */}

                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() =>
                                                            fileInputRef.current.click()
                                                        }
                                                        type="button"
                                                        className="text-white cursor-pointer bg-gray-800 hover:bg-ray-500 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
                                                    >
                                                        <label className="w-full cursor-pointer">
                                                            Cập nhật ảnh đại
                                                            diện
                                                        </label>
                                                    </button>
                                                    {avatar.imgSrc &&
                                                    avatar.imgSrc !=
                                                        DefaultAvatar ? (
                                                        <span
                                                            className="flex justify-center items-center cursor-pointer border rounded-lg border-red-600 px-3 group transition-all duration-150 ease-in hover:bg-red-500"
                                                            onClick={
                                                                handleDeleteAvatar
                                                            }
                                                        >
                                                            <MdDeleteOutline className="text-red-600 text-xl group-hover:text-white" />
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </section>

                                        <div className="my-4 border-b border-gray-200"></div>

                                        <h1 className="mb-4 serif text-2xl font-bold text-center md:text-left">
                                            Đồng bộ và tích hợp
                                        </h1>
                                        <div className="flex flex-col md:grid md:grid-cols-2 gap-x-4 w-full justify-between items-center">
                                            <div className="w-full">
                                                <label className="block mb-2 text-md font-medium text-gray-900">
                                                    SAP ID{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </label>
                                                {/* <Field
                                                    name="sapId"
                                                    className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                    onChange={(e) => {
                                                        setFieldValue(
                                                            "sapId",
                                                            e.target.value
                                                        );
                                                        setInput((prev) => ({
                                                            ...prev,
                                                            sapId: e.target
                                                                .value,
                                                        }));
                                                    }}
                                                /> */}
                                                <AsyncSelectField
                                                    innerRef={sapIdSelectRef}
                                                    name="sapId"
                                                    loadOptions={loadSapId}
                                                    options={sapId}
                                                    setInput={setInput}
                                                />
                                                {errors.sapId &&
                                                touched.sapId ? (
                                                    <span className="text-xs text-red-600">
                                                        <ErrorMessage name="sapId" />
                                                    </span>
                                                ) : (
                                                    <span className="block mt-[8px] h-[14.55px]"></span>
                                                )}
                                            </div>
                                            <div className="w-full">
                                                <label className="block mb-2 text-md font-medium text-gray-900">
                                                    INTEGRATION ID{" "}
                                                    {/* <span className="text-red-600">
                                                        *
                                                    </span> */}
                                                </label>
                                                <Field
                                                    name="integrationId"
                                                    className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                    disabled
                                                    value="1"
                                                    // onChange={(e) => {
                                                    //     setFieldValue(
                                                    //         "integrationId",
                                                    //         e.target.value
                                                    //     );
                                                    //     setInput((prev) => ({
                                                    //         ...prev,
                                                    //         integrationId:
                                                    //             e.target.value,
                                                    //     }));
                                                    // }}
                                                />
                                                {errors.integrationId &&
                                                touched.integrationId ? (
                                                    <span className="text-xs text-red-600">
                                                        <ErrorMessage name="integrationId" />
                                                    </span>
                                                ) : (
                                                    <span className="block mt-[8px] h-[14.55px]"></span>
                                                )}
                                            </div>
                                            <div className="w-full">
                                                <label className="block mb-2 text-md font-medium text-gray-900">
                                                    Chi nhánh{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </label>
                                                <AsyncSelectField
                                                    innerRef={branchSelectRef}
                                                    name="branch"
                                                    loadOptions={loadBranches}
                                                    options={branches}
                                                    setInput={setInput}
                                                />
                                                {/* <Field
                                                    name="branch"
                                                    className="border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                                    onChange={(e) => {
                                                        setFieldValue(
                                                            "branch",
                                                            e.target.value
                                                        );
                                                        setInput((prev) => ({
                                                            ...prev,
                                                            branch: e.target
                                                                .value,
                                                        }));
                                                    }}
                                                /> */}
                                                {errors.branch &&
                                                touched.branch ? (
                                                    <span className="text-xs text-red-600">
                                                        <ErrorMessage name="branch" />
                                                    </span>
                                                ) : (
                                                    <span className="block mt-[8px] h-[14.55px]"></span>
                                                )}
                                            </div>
                                            <div className="w-full">
                                                <label className="block mb-2 text-md font-medium text-gray-900">
                                                    Nhà máy{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </label>
                                                <SelectField
                                                    innerRef={factorySelectRef}
                                                    name="factory"
                                                    // loadOptions={loadFactories}
                                                    options={factories}
                                                    isLoading={factoryLoading}
                                                    setInput={setInput}
                                                />
                                                {errors.factory &&
                                                touched.factory ? (
                                                    <span className="text-xs text-red-600">
                                                        <ErrorMessage name="factory" />
                                                    </span>
                                                ) : (
                                                    <span className="block mt-[8px] h-[14.55px]"></span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="mt-4 self-end flex items-center justify-center text-white bg-[#155979] hover:bg-[#1A6D94] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center gap-x-2"
                                        >
                                            Lưu lại
                                        </button>
                                    </Form>
                                </div>
                            );
                        }}
                    </Formik>
                    <div className="pb-4"></div>
                </div>
            </div>
            {loading && <Loader />}
        </Layout>
    );
}

export default CreateUser;
