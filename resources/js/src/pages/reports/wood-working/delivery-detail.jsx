import React, { useState } from "react";
import Layout from "../../../layouts/layout";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { IoSearch, IoClose } from "react-icons/io5";
import { PiFilePdfBold } from "react-icons/pi";
import { FiCheck } from "react-icons/fi";
import {
    FaArrowRotateLeft,
    FaArrowUpRightFromSquare,
    FaCheck,
} from "react-icons/fa6";
import { IoMdRadioButtonOff, IoMdRadioButtonOn } from "react-icons/io";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../assets/styles/datepicker.css";
import { format, startOfDay, endOfDay } from "date-fns";
import { Checkbox, CheckboxGroup } from "@chakra-ui/react";
import { Spinner } from "@chakra-ui/react";
import toast from "react-hot-toast";
import reportApi from "../../../api/reportApi";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import useAppContext from "../../../store/AppContext";

function DeliveryDetailReport() {
    const navigate = useNavigate();

    const { user } = useAppContext();

    // Date picker
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());

    // Loading States
    const [isTeamLoading, setIsTeamLoading] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState([]);

    const [selectedFactory, setSelectedFactory] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [isReceived, setIsReceived] = useState(true);
    const [teamData, setTeamData] = useState([]);

    const [reportData, setReportData] = useState(null);

    const handleFactorySelect = async (factory) => {
        setTeamData(null);
        setSelectedTeams([]);
        console.log("Nhà máy đang chọn là:", factory);
        setSelectedFactory(factory);

        getTeamData(factory);
        getReportData();
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setSelectedTeams((prevValues) => {
            if (checked) {
                if (!prevValues.includes(value)) {
                    return [...prevValues, value];
                }            
            } else {
                return prevValues.filter((val) => val !== value);
            }
            return prevValues;
            
        });
        getReportData();

    };

    const getTeamData = async (param) => {
        setIsTeamLoading(true);
        try {
            const res = await reportApi.getTeamByFactory(param);
            setIsTeamLoading(false);
            setTeamData(res);
            setSelectAll(false);
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi lấy dữ liệu.");
            setIsTeamLoading(false);
            setSelectAll(false);
            console.error(error);
        }
    };

    const handleSelectAll = () => {
        setSelectAll((prevSelectAll) => {
            const newSelectAll = !prevSelectAll;
            if (newSelectAll) {
                const allTeamCodes = teamData.map((item) => item.Code);
                setSelectedTeams([...new Set(allTeamCodes)]);
                if (fromDate && toDate && selectedFactory && isReceived && selectedTeams !== null) {
                    getReportData();
                }
            } else {
                setSelectedTeams([]);
            }
            return newSelectAll;
        });

    };

    const handleResetFilter = () => {
        setSelectedFactory(null);
        setSelectAll(false);
        setIsReceived(true);
        setTeamData([]);

        setReportData(null);

        toast.success("Đặt lại bộ lọc thành công.");
    };

    const handleExportExcel = () => {
        toast.success("Xuất file excel thành công.");
    };

    const handleExportPDF = () => {
        toast.success("Xuất file PDF thành công.");
    };

    // const getReportData = async () => {
    //     let params = {
    //         from_date: format(fromDate, "yyyy-MM-dd"),
    //         to_date: format(toDate, "yyyy-MM-dd"),
    //         To: selectedTeams,
    //         branch: selectedFactory === "TH" ? 1 : 3,
    //         plant: selectedFactory,
    //         status_code: isReceived ? 1 : 0,
    //     }

    //     try {
    //         const res = await reportApi.getDeliveryDetailReport(
    //                 params.status_code,
    //                 params.To,
    //                 params.branch,
    //                 params.plant,
    //                 params.from_date,
    //                 params.to_date
    //         );
    //         setReportData(res);
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Đã xảy ra lỗi khi lấy dữ liệu.");
    //     }
    // };

    const getReportData = async () => {
        let params = {
            from_date: format(fromDate, "yyyy-MM-dd"),
            to_date: format(toDate, "yyyy-MM-dd"),
            To: selectedTeams,
            branch: selectedFactory === "TH" ? 1 : 3,
            plant: selectedFactory,
            status_code: isReceived ? 1 : 0,
        };
    
        const allParamsFilled = (params) => {
            for (let key in params) {
                if (params.hasOwnProperty(key)) {
                    if (params[key] === '' || params[key] === null || params[key] === undefined) {
                        return false;
                    }
                }
            }
            return true;
        };
    
        if (allParamsFilled(params)) {
            try {
                const res = await reportApi.getDeliveryDetailReport(
                    params.status_code,
                    params.To,
                    params.branch,
                    params.plant,
                    params.from_date,
                    params.to_date
                );
                setReportData(res);
            } catch (error) {
                console.error(error);
                toast.error("Đã xảy ra lỗi khi lấy dữ liệu.");
            }
        } else {
            console.log('Không thể gọi API vì không đủ thông tin');
            toast.warn("Vui lòng điền đầy đủ thông tin để tải báo cáo.");
        }
    };

    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([
        {
            itemname: "Gỗ sồi",
            thickness: "20",
            width: "100",
            height: "1000",
            unit: "Tấm",
            quantity: "50",
            m3: "0.1",
            sender: "Nguyễn Văn A",
            send_date: "2024-07-12 08:30",
            receiver: "Trần Thị B",
            receive_date: "2024-07-12 10:15",
            production_order: "PO-001",
        },
        {
            itemname: "Gỗ thông",
            thickness: "15",
            width: "150",
            height: "2000",
            unit: "Tấm",
            quantity: "30",
            m3: "0.135",
            sender: "Lê Văn C",
            send_date: "2024-07-13 09:45",
            receiver: "Phạm Thị D",
            receive_date: "2024-07-13 11:30",
            production_order: "PO-002",
        },
        {
            itemname: "Gỗ óc chó",
            thickness: "25",
            width: "200",
            height: "1500",
            unit: "Tấm",
            quantity: "20",
            m3: "0.15",
            sender: "Hoàng Văn E",
            send_date: "2024-07-14 07:15",
            receiver: "Ngô Thị F",
            receive_date: "2024-07-14 09:00",
            production_order: "PO-003",
        },
        {
            itemname: "Gỗ teak",
            thickness: "30",
            width: "120",
            height: "2500",
            unit: "Tấm",
            quantity: "15",
            m3: "0.135",
            sender: "Đặng Văn G",
            send_date: "2024-07-15 10:30",
            receiver: "Bùi Thị H",
            receive_date: "2024-07-15 13:45",
            production_order: "PO-004",
        },
        {
            itemname: "Gỗ hương",
            thickness: "18",
            width: "180",
            height: "1800",
            unit: "Tấm",
            quantity: "25",
            m3: "0.1458",
            sender: "Vũ Văn I",
            send_date: "2024-07-16 08:00",
            receiver: "Lý Thị K",
            receive_date: "2024-07-16 10:30",
            production_order: "PO-005",
        },
        {
            itemname: "Gỗ lim",
            thickness: "22",
            width: "160",
            height: "2200",
            unit: "Tấm",
            quantity: "18",
            m3: "0.12672",
            sender: "Đinh Văn L",
            send_date: "2024-07-17 11:15",
            receiver: "Dương Thị M",
            receive_date: "2024-07-17 14:00",
            production_order: "PO-006",
        },
        {
            itemname: "Gỗ trắc",
            thickness: "28",
            width: "140",
            height: "1600",
            unit: "Tấm",
            quantity: "12",
            m3: "0.07392",
            sender: "Phan Văn N",
            send_date: "2024-07-18 09:30",
            receiver: "Hồ Thị P",
            receive_date: "2024-07-18 11:45",
            production_order: "PO-007",
        },
        {
            itemname: "Gỗ dẻ gai",
            thickness: "16",
            width: "130",
            height: "1900",
            unit: "Tấm",
            quantity: "35",
            m3: "0.13832",
            sender: "Trịnh Văn Q",
            send_date: "2024-07-19 07:45",
            receiver: "Mai Thị R",
            receive_date: "2024-07-19 10:00",
            production_order: "PO-008",
        },
        {
            itemname: "Gỗ xoan đào",
            thickness: "24",
            width: "170",
            height: "2100",
            unit: "Tấm",
            quantity: "22",
            m3: "0.18768",
            sender: "Lương Văn S",
            send_date: "2024-07-20 10:00",
            receiver: "Đỗ Thị T",
            receive_date: "2024-07-20 12:30",
            production_order: "PO-009",
        },
        {
            itemname: "Gỗ mun",
            thickness: "32",
            width: "110",
            height: "1700",
            unit: "Tấm",
            quantity: "10",
            m3: "0.05984",
            sender: "Châu Văn U",
            send_date: "2024-07-21 08:30",
            receiver: "Tống Thị V",
            receive_date: "2024-07-21 11:15",
            production_order: "PO-010",
        },
        {
            itemname: "Gỗ gõ đỏ",
            thickness: "26",
            width: "190",
            height: "2300",
            unit: "Tấm",
            quantity: "16",
            m3: "0.18408",
            sender: "Tạ Văn X",
            send_date: "2024-07-22 09:15",
            receiver: "Quách Thị Y",
            receive_date: "2024-07-22 12:00",
            production_order: "PO-011",
        },
        {
            itemname: "Gỗ cẩm lai",
            thickness: "19",
            width: "145",
            height: "1950",
            unit: "Tấm",
            quantity: "28",
            m3: "0.15249",
            sender: "Hà Văn Z",
            send_date: "2024-07-23 11:30",
            receiver: "Kiều Thị W",
            receive_date: "2024-07-23 14:15",
            production_order: "PO-012",
        },
        {
            itemname: "Gỗ sao",
            thickness: "21",
            width: "155",
            height: "2400",
            unit: "Tấm",
            quantity: "24",
            m3: "0.18648",
            sender: "Đoàn Văn A1",
            send_date: "2024-07-24 08:45",
            receiver: "Trương Thị B1",
            receive_date: "2024-07-24 11:30",
            production_order: "PO-013",
        },
        {
            itemname: "Gỗ chò chỉ",
            thickness: "23",
            width: "135",
            height: "2050",
            unit: "Tấm",
            quantity: "20",
            m3: "0.12701",
            sender: "Bành Văn C1",
            send_date: "2024-07-25 10:15",
            receiver: "Lưu Thị D1",
            receive_date: "2024-07-25 13:00",
            production_order: "PO-014",
        },
        {
            itemname: "Gỗ giáng hương",
            thickness: "27",
            width: "175",
            height: "1850",
            unit: "Tấm",
            quantity: "14",
            m3: "0.12155",
            sender: "Mạc Văn E1",
            send_date: "2024-07-26 09:00",
            receiver: "Thái Thị F1",
            receive_date: "2024-07-26 11:45",
            production_order: "PO-015",
        },
    ]);

    // Column Definitions: Defines the columns to be displayed.
    const [colDefs, setColDefs] = useState([
        { headerName: "Tên", field: "itemname", width: 350 },
        { headerName: "Dày", field: "thickness", width: 100 },
        { headerName: "Rộng", field: "width", width: 100 },
        { headerName: "Dài", field: "height", width: 100 },
        { headerName: "ĐVT", field: "unit", width: 100 },
        { headerName: "Số lượng", field: "quantity", width: 100 },
        { headerName: "M3", field: "m3", width: 180 },
        { headerName: "Người giao", field: "sender" },
        { headerName: "Ngày giờ giao", field: "send_date" },
        { headerName: "Người nhận", field: "receiver" },
        { headerName: "Ngày giờ nhận", field: "receive_date" },
        { headerName: "Lệnh sản xuất", field: "production_order" },
    ]);

    const FactoryOption = ({ value, label }) => (
        <div
            className={`group hover:border-[#86ABBE] hover:bg-[#eaf8ff] flex items-center justify-center space-x-2 text-base text-center rounded-3xl border-2 p-1.5 px-3 pl-0 w-full cursor-pointer active:scale-[.92] active:duration-75 transition-all ${
                selectedFactory === value
                    ? "border-[#86ABBE] bg-[#eaf8ff]"
                    : "border-gray-300"
            }`}
            onClick={() => handleFactorySelect(value)}
        >
            {selectedFactory === value ? (
                <IoMdRadioButtonOn className="w-5 h-6 text-[#17506B]" />
            ) : (
                <IoMdRadioButtonOff className="w-5 h-6 text-gray-400 group-hover:text-[#17506B]" />
            )}
            <div
                className={`${
                    selectedFactory === value
                        ? "text-[#17506B] font-medium"
                        : "text-gray-400 group-hover:text-[#17506B]"
                }`}
            >
                {label}
            </div>
        </div>
    );

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <Layout>
            <div className="overflow-x-hidden">
                <div className="w-screen xl:mb-4 mb-6 p-6 px-5 xl:p-5 xl:px-12 ">
                    {/* Title */}
                    <div className="flex items-center justify-between space-x-6 mb-3.5">
                        <div className="flex items-center space-x-4">
                            <div
                                className="p-2 hover:bg-gray-200 rounded-full cursor-pointer active:scale-[.87] active:duration-75 transition-all"
                                onClick={handleGoBack}
                            >
                                <FaArrowLeft className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex flex-col mb-0 pb-0">
                                <div className="text-sm text-[#17506B]">
                                    Báo cáo sản lượng
                                </div>
                                <div className=" text-2xl font-semibold">
                                    Báo cáo thông tin chi tiết giao nhận
                                </div>
                            </div>
                        </div>

                        {/* Search & Export */}
                        <div className="w-1/2 flex items-center justify-between border-2 border-gray-300 p-2 px-4 pr-1  rounded-lg bg-[#F9FAFB]">
                            <div className="flex items-center space-x-3 w-2/3">
                                <IoSearch className="w-6 h-6 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tất cả..."
                                    className=" w-full focus:ring-transparent !outline-none bg-[#F9FAFB]  border-gray-30 ring-transparent border-transparent focus:border-transparent focus:ring-0"
                                />
                            </div>

                            <div className="flex justify-end items-center divide-x-2 w-1/3">
                                <div className="mx-2.5"></div>
                                <div>
                                    <FaArrowRotateLeft
                                        className="mx-2.5 w-[22px] h-[22px] text-gray-300 hover:text-[#2e6782] cursor-pointer active:scale-[.92] active:duration-75 transition-all"
                                        onClick={handleResetFilter}
                                    />
                                </div>
                                <div>
                                    <FaArrowUpRightFromSquare
                                        className="mx-2.5 w-5 h-5 text-gray-300 hover:text-[#2e6782] cursor-pointer active:scale-[.92] active:duration-75 transition-all"
                                        onClick={handleExportExcel}
                                    />
                                </div>
                                <div>
                                    <PiFilePdfBold
                                        className="mx-2.5 w-6 h-6 text-gray-300 hover:text-[#2e6782] cursor-pointer active:scale-[.92] active:duration-75 transition-all"
                                        onClick={handleExportPDF}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="border-2 border-gray-300 bg-white rounded-xl py-2 pb-3">
                        {/* Filter */}
                        <div className="flex items-center space-x-3 divide-x-2 divide-gray-100 px-4 mt-1">
                            <div className="flex space-x-3 w-1/4">
                                <div className="col-span-1 w-full">
                                    <label
                                        htmlFor="indate"
                                        className="block mb-1 text-sm font-medium text-gray-900 "
                                    >
                                        Từ ngày
                                    </label>
                                    <DatePicker
                                        selected={fromDate}
                                        onChange={(date) => {
                                            setFromDate(date);
                                            if (fromDate && toDate && selectedFactory && isReceived && selectedTeams) {
                                                getReportData();
                                            }
                                        }}
                                        className=" border border-gray-300 text-gray-900 text-base rounded-md focus:ring-whites cursor-pointer focus:border-none block w-full p-1.5"
                                    />
                                </div>
                                <div className="col-span-1 w-full">
                                    <label
                                        htmlFor="indate"
                                        className="block mb-1 text-sm font-medium text-gray-900 "
                                    >
                                        Đến ngày
                                    </label>
                                    <DatePicker
                                        selected={toDate}
                                        onChange={(date) => {
                                            setToDate(date);
                                            if (fromDate && toDate && selectedFactory && isReceived && selectedTeams) {
                                                getReportData();
                                            }
                                        }}
                                        className=" border border-gray-300 text-gray-900 text-base rounded-md focus:ring-whites cursor-pointer focus:border-none block w-full p-1.5"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 w-2/4 px-3">
                                <div className="col-span-1 w-full">
                                    <label
                                        htmlFor="indate"
                                        className="block mb-1 text-sm font-medium text-gray-900"
                                    >
                                        Chọn nhà máy
                                    </label>
                                    <FactoryOption
                                        value="TH"
                                        label="Thuận Hưng"
                                    />
                                </div>
                                <div className="col-span-1 w-full flex items-end">
                                    <FactoryOption
                                        value="YS1"
                                        label="Yên Sơn 1"
                                    />
                                </div>
                                <div className="col-span-1 w-full flex items-end">
                                    <FactoryOption
                                        value="TB"
                                        label="Thái Bình"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 w-1/4 px-3">
                                <div className="col-span-1 w-full">
                                    <label
                                        htmlFor="indate"
                                        className="block mb-1 text-sm font-medium text-gray-900"
                                    >
                                        Trạng thái
                                    </label>
                                    <div className="flex w-full">
                                        <div
                                            className={`flex space-x-1 items-center justify-center p-1.5 px-3 border-2  rounded-l-lg w-full text-center cursor-pointer active:scale-[.96] active:duration-75 transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-500 ${
                                                isReceived === false
                                                    ? "border-red-300 bg-red-100 text-red-600 font-medium"
                                                    : "border-gray-200 text-gray-400"
                                            } `}
                                            onClick={() => {
                                                setIsReceived(false);
                                                if (fromDate && toDate && selectedFactory && isReceived && selectedTeams) {
                                                    getReportData();
                                                }
                                            }}
                                        >
                                            <span>Chưa nhận</span>
                                            {isReceived === false ? (
                                                <IoClose className="w-5 h-5" />
                                            ) : null}
                                        </div>
                                        <div
                                            className={`flex space-x-1 items-center justify-center p-1.5 px-3 border-2  rounded-r-lg w-full text-center cursor-pointer active:scale-[.96] active:duration-75 transition-all hover:bg-green-50 hover:border-green-200 hover:text-green-500  ${
                                                isReceived === true
                                                    ? "border-l-2 font-medium border-green-300 bg-green-100 text-green-600"
                                                    : "border-gray-200 text-gray-400"
                                            }`}
                                            onClick={() => {
                                                setIsReceived(true);
                                                if (fromDate && toDate && selectedFactory && isReceived && selectedTeams) {
                                                    getReportData();
                                                }
                                            }}
                                        >
                                            <span>Đã nhận</span>
                                            {isReceived === true ? (
                                                <FiCheck className="w-5 h-5" />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Select */}
                        {selectedFactory && (
                            <div className=" border-2 border-[#C6D2D9] bg-[#f0faff] rounded-lg p-2 py-2 px-4 pb-4  m-2 mt-3 mx-4">
                                {isTeamLoading ? (
                                    <div className="text-center my-3 mt-5">
                                        <Spinner
                                            thickness="4px"
                                            speed="0.65s"
                                            emptyColor="gray.200"
                                            color="#155979"
                                            size="xl"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between space-x-3">
                                            <div className="font-semibold">
                                                Chọn các tổ thực hiện:
                                            </div>
                                            <div
                                                className="flex items-center space-x-2 font-semibold p-1 text-[#17506B] bg-[#c9dde6] px-3 rounded-lg cursor-pointer active:scale-[.87] active:duration-75 transition-all"
                                                onClick={handleSelectAll}
                                            >
                                                {selectAll && <IoClose />}
                                                {selectAll ? (
                                                    <div>Bỏ chọn tất cả</div>
                                                ) : (
                                                    <div>Chọn tất cả</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full grid grid-cols-4">
                                            <div className="col-span-1 space-y-2 ">
                                                <div className="text-[#155979] uppercase font-medium">
                                                    Sơ chế
                                                </div>
                                                {teamData
                                                    .filter(
                                                        (item) =>
                                                            item.CDOAN === "SC"
                                                    )
                                                    .map((item, index) => (
                                                        <div key={index}>
                                                            <Checkbox
                                                                value={
                                                                    item.Code
                                                                }
                                                                onChange={
                                                                    handleCheckboxChange
                                                                }
                                                                isChecked={selectedTeams.includes(
                                                                    item.Code
                                                                )}
                                                            >
                                                                {item.Name}
                                                            </Checkbox>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="col-span-1 space-y-2">
                                                <div className="text-[#155979] uppercase font-medium">
                                                    Tinh chế
                                                </div>
                                                {teamData
                                                    .filter(
                                                        (item) =>
                                                            item.CDOAN === "TC"
                                                    )
                                                    .map((item, index) => (
                                                        <div key={index}>
                                                            <Checkbox
                                                                value={
                                                                    item.Code
                                                                }
                                                                onChange={
                                                                    handleCheckboxChange
                                                                }
                                                                isChecked={selectedTeams.includes(
                                                                    item.Code
                                                                )}
                                                            >
                                                                {item.Name}
                                                            </Checkbox>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="col-span-1 space-y-2">
                                                <div className="text-[#155979] uppercase font-medium">
                                                    Hoàn thiện
                                                </div>
                                                {teamData
                                                    .filter(
                                                        (item) =>
                                                            item.CDOAN === "HT"
                                                    )
                                                    .map((item, index) => (
                                                        <div key={index}>
                                                            <Checkbox
                                                                value={
                                                                    item.Code
                                                                }
                                                                onChange={
                                                                    handleCheckboxChange
                                                                }
                                                                isChecked={selectedTeams.includes(
                                                                    item.Code
                                                                )}
                                                            >
                                                                {item.Name}
                                                            </Checkbox>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="col-span-1 space-y-2">
                                                <div className="text-[#155979] uppercase font-medium">
                                                    Đóng gói
                                                </div>
                                                {teamData
                                                    .filter(
                                                        (item) =>
                                                            item.CDOAN === "DG"
                                                    )
                                                    .map((item, index) => (
                                                        <div key={index}>
                                                            <Checkbox
                                                                value={
                                                                    item.Code
                                                                }
                                                                onChange={
                                                                    handleCheckboxChange
                                                                }
                                                                isChecked={selectedTeams.includes(
                                                                    item.Code
                                                                )}
                                                            >
                                                                {item.Name}
                                                            </Checkbox>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    {reportData?.length > 0 ? (
                        <div
                            className="ag-theme-quartz border-2 border-gray-300 rounded-lg mt-6 "
                            style={{
                                height: 620,
                                fontSize: 16,
                            }}
                        >
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={colDefs}
                            />
                        </div>
                    ) : (
                        <div className="mt-4 bg-[#dbdcdd] flex items-center justify-center  p-2 px-4 pr-1 rounded-lg ">
                            Không có dữ liệu để hiển thị.
                        </div>
                    )}

                    {/* <div className="flex flex-col">
                        <div className="overflow-x-auto overflow-y-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
                                <div className="overflow-auto border-2 rounded-xl border-gray-500">
                                    <table className="min-w-full   text-center font-light text-surface">
                                        <thead className="rounded-t-xl bg-[#DBDCDD] border-b-2 border-gray-500 font-medium">
                                            <tr className="rounded-t-xl">
                                                <th
                                                    scope="col"
                                                    className="border-e-2 border-gray-500 px-6 py-4"
                                                >
                                                    #
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="border-e-2 border-gray-500 px-6 py-4"
                                                >
                                                    First
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="border-e-2 border-gray-500 px-6 py-4"
                                                >
                                                    Last
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-4"
                                                >
                                                    Handle
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-normal">
                                            <tr className="border-b-2 border-gray-500">
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4 font-medium">
                                                    1
                                                </td>
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4">
                                                    Mark
                                                </td>
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4">
                                                    Otto
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    @mdo
                                                </td>
                                            </tr>
                                            <tr className="border-b-2 border-gray-500">
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4 font-medium">
                                                    2
                                                </td>
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4">
                                                    Jacob
                                                </td>
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4">
                                                    Thornton
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    @fat
                                                </td>
                                            </tr>
                                            <tr className="border-gray-500">
                                                <td className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4 font-medium">
                                                    3
                                                </td>
                                                <td
                                                    colSpan="2"
                                                    className="whitespace-nowrap border-e-2 border-gray-500 px-6 py-4"
                                                >
                                                    Larry the Bird
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    @twitter
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
                {/* <div className="py-4"></div> */}
            </div>
        </Layout>
    );
}

export default DeliveryDetailReport;