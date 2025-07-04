import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import Layout from "../../../layouts/layout";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { IoSearch, IoClose } from "react-icons/io5";
import AG_GRID_LOCALE_VI from "../../../utils/locale.vi";
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
import "ag-grid-enterprise";
// import "ag-grid-charts-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import useAppContext from "../../../store/AppContext";

function DefectResolution() {
    const navigate = useNavigate();

    const { user } = useAppContext();
    const gridRef = useRef();

    const getFirstDayOfCurrentMonth = () => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    // Date picker
    const [fromDate, setFromDate] = useState(getFirstDayOfCurrentMonth());
    const [toDate, setToDate] = useState(new Date());

    // Loading States
    const [isDataReportLoading, setIsDataReportLoading] = useState(false);
    const [selectedTeams, setSelectedTeams] = useState([]);

    const [selectedFactory, setSelectedFactory] = useState(null);
    const [isReceived, setIsReceived] = useState(true);

    const [reportData, setReportData] = useState(null);

    const handleFactorySelect = async (factory) => {
        console.log("Nhà máy đang chọn là:", factory);
        setSelectedFactory(factory);
        setReportData(null);
        setTeamData(null);
        setSelectedTeams([]);
    };

    const getReportData = useCallback(async () => {
        let params = {
            from_date: format(fromDate, "yyyy-MM-dd"),
            to_date: format(toDate, "yyyy-MM-dd"),
            plant: selectedFactory,
        };
        console.log(params); // Log toàn bộ giá trị param trước khi chạy API
        setIsDataReportLoading(true);
        try {
            const res = await reportApi.getDefectResolutionReport(
                params.plant,
                params.from_date,
                params.to_date
            );
            const formattedData = res.map((item) => ({
                week: item.week,
                root_cause: item.NguonLoi,
                root_place: item.NoiBaoLoi,
                root_place_name: item.TenToBaoLoi,
                defect_type: item.LoiLoai,
                resolution: item.HXL,
                itemname: item.ItemName,
                thickness: Number(item.CDay),
                width: Number(item.CRong),
                height: Number(item.CDai),
                quantity: parseInt(item.Quantity),
                m3: item.M3,
                sender: item.NguoiGiao,
                send_date: item.created_at,
                receiver: item.NguoiNhan,
                defect_causing_team: item.ToGayRaLoi || "Không xác định",
                receiving_team: item.ToChuyenVe,
                m3sap: item.M3SAP,
                handle_date: item.ngaynhan,
                lsx_from: item.LSX,
            }));
            setIsDataReportLoading(false);
            setRowData(formattedData);
            setReportData(res);
        } catch (error) {
            console.error(error);
            toast.error("Đã xảy ra lỗi khi lấy dữ liệu.");
            setIsDataReportLoading(false);
        }
    }, [fromDate, toDate, selectedFactory]);

    useEffect(() => {
        const allFieldsFilled = selectedFactory && fromDate && toDate;
        if (allFieldsFilled) {
            getReportData();
        } else {
            console.log("Không thể gọi API vì không đủ thông tin");
        }
    }, [selectedFactory, fromDate, toDate, getReportData]);

    const handleResetFilter = () => {
        setSelectedFactory(null);
        setSelectAll(false);
        setIsReceived(true);
        setTeamData([]);

        setReportData(null);

        toast.success("Đặt lại bộ lọc thành công.");
    };

    const handleExportExcel = useCallback(() => {
        gridRef.current.api.exportDataAsExcel();
    }, []);

    const handleExportPDF = () => {
        toast("Chức năng xuất PDF đang được phát triển.");
    };

    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([]);

    // Column Definitions: Defines the columns to be displayed.
    const [colDefs, setColDefs] = useState([
        {
            headerName: "Tổ báo lỗi",
            field: "root_place_name",
            width: 150,
            suppressHeaderMenuButton: true,
            rowGroup: true,
            filter: true,
            sort: "asc",
            pinned: 'left',
            hide: true,
            headerComponentParams: { displayName: "Tổ báo lỗi" },
        },
        {
            headerName: "Tuần",
            field: "week",
            width: 70,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Nơi báo lỗi",
            field: "root_place",
            width: 150,
            suppressHeaderMenuButton: true,
            filter: true,
            hide: true,
        },
        {
            headerName: "Chi tiết cụm",
            field: "itemname",
            width: 350,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Dày",
            field: "thickness",
            width: 80,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Rộng",
            field: "width",
            width: 80,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Dài",
            field: "height",
            width: 80,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Số lượng",
            field: "quantity",
            width: 100,
            suppressHeaderMenuButton: true,
            valueFormatter: params => {
                return params.value ? params.value.toLocaleString('en-US') : '';
            },
            aggFunc: 'sum',
            filter: true,
            headerComponentParams: { displayName: "Số lượng" }
        },
        // { headerName: "M3", field: "m3", width: 120 },
        {
            headerName: "M3",
            field: "m3sap",
            width: 120,
            aggFunc: 'sum',
            headerComponentParams: { displayName: "M3" },
            filter: true,
            valueFormatter: params => {
                return params.value ? params.value.toFixed(6) : '0.000000';
            },
        },
        {
            headerName: "Loại lỗi",
            field: "defect_type",
            width: 150,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Biện pháp xử lý",
            field: "resolution",
            width: 370,
            suppressHeaderMenuButton: true,
            filter: true,
        },
        {
            headerName: "Tổ gây ra lỗi",
            field: "defect_causing_team",
            width: 160,
            filter: true,
        },
        { headerName: "Tổ chuyển về", field: "receiving_team", width: 160, filter: true },
        { headerName: "Người tạo", field: "sender", filter: true },
        { headerName: "Ngày tạo", field: "send_date", filter: true },
        { headerName: "Người xử lý", field: "receiver", filter: true },
        { headerName: "Ngày xử lý", field: "handle_date", filter: true },
        { headerName: "LSX ghi nhận lỗi", field: "lsx_from", filter: true },
    ]);

    const localeText = useMemo(() => {
        return AG_GRID_LOCALE_VI;
    }, []);

    const groupDisplayType = "multipleColumns";
    const getRowStyle = (params) => {
        if (params.node.rowIndex % 2 === 0) {
            return { background: "#F6F6F6" };
        }
        return { background: "#ffffff" };
    };

    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 150,
        };
    }, []);

    const autoGroupColumnDef = useMemo(() => {
        return {
            minWidth: 300,
        };
    }, []);

    const FactoryOption = ({ value, label }) => (
        <div
            className={`group hover:border-[#86ABBE] hover:bg-[#eaf8ff] flex items-center justify-center space-x-2 text-base text-center rounded-3xl border-2 p-1.5 px-3 pl-0 w-full cursor-pointer active:scale-[.92] active:duration-75 transition-all ${selectedFactory === value
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
                className={`${selectedFactory === value
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
                <div className="w-screen  p-6 px-5 xl:p-5 xl:px-12 ">
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
                                    Báo cáo chế biến gỗ
                                </div>
                                <div className="serif font-bold text-3xl">
                                    Báo cáo biện pháp xử lý lỗi
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
                                {/* <div>
                                    <PiFilePdfBold
                                        className="mx-2.5 w-6 h-6 text-gray-300 hover:text-[#2e6782] cursor-pointer active:scale-[.92] active:duration-75 transition-all"
                                        onClick={handleExportPDF}
                                    />
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className=" bg-white rounded-xl py-2 pb-3">
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
                                        dateFormat="dd/MM/yyyy"
                                        onChange={(date) => {
                                            setFromDate(date);
                                            if (
                                                fromDate &&
                                                toDate &&
                                                selectedFactory &&
                                                isReceived &&
                                                selectedTeams
                                            ) {
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
                                        dateFormat="dd/MM/yyyy"
                                        onChange={(date) => {
                                            setToDate(date);
                                            if (
                                                fromDate &&
                                                toDate &&
                                                selectedFactory &&
                                                isReceived &&
                                                selectedTeams
                                            ) {
                                                getReportData();
                                            }
                                        }}
                                        className=" border border-gray-300 text-gray-900 text-base rounded-md focus:ring-whites cursor-pointer focus:border-none block w-full p-1.5"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 w-3/4 px-3">
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
                                    <FactoryOption value="YS" label="Yên Sơn" />
                                </div>
                                <div className="col-span-1 w-full flex items-end">
                                    <FactoryOption
                                        value="TB"
                                        label="Thái Bình"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {isDataReportLoading ? (
                        <div className="mt-2 bg-[#C2C2CB] flex items-center justify-center  p-2 px-4 pr-1 rounded-lg ">
                            {/* <div>Đang tải dữ liệu</div> */}
                            <div class="dots"></div>
                        </div>
                    ) : (
                        <>
                            {reportData?.length > 0 ? (
                                <div>
                                    <div
                                        className="ag-theme-quartz border-2 border-gray-300 rounded-lg mt-2 "
                                        style={{
                                            height: 630,
                                            fontSize: 16,
                                        }}
                                    >
                                        <AgGridReact
                                            ref={gridRef}
                                            rowData={rowData}
                                            columnDefs={colDefs}
                                            autoGroupColumnDef={
                                                autoGroupColumnDef
                                            }
                                            groupDisplayType={groupDisplayType}
                                            getRowStyle={getRowStyle}
                                            localeText={localeText}
                                            grandTotalRow={"bottom"}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 bg-[#C2C2CB] flex items-center justify-center  p-2 px-4 pr-1 rounded-lg ">
                                    Không có dữ liệu để hiển thị.
                                </div>
                            )}
                        </>
                    )}
                </div>
                {/* <div className="py-4"></div> */}
            </div>
        </Layout>
    );
}

export default DefectResolution;
