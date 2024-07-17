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
import { PiFilePdfBold } from "react-icons/pi";
import { FiCheck } from "react-icons/fi";
import "../../../assets/styles/index.css";
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
import { th } from "date-fns/locale";

function CBGWoodDryingReports() {
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

    const getReportData = useCallback(async () => {
        let params = {
            from_date: format(fromDate, "yyyy-MM-dd"),
            to_date: format(toDate, "yyyy-MM-dd"),
        };
        setIsDataReportLoading(true);
        try {
            const res = await reportApi.getDefectResolutionReport(
                params.from_date,
                params.to_date
            );
            const formattedData = res.map((item) => ({
                itemname: item.ItemName,
                thickness: item.CDay,
                width: item.CRong,
                height: item.CDai,
                th_xepsay: item.sepxay || 0,
                th_vaolo: item.vaolo || 0,
                th_daralo: item.ralo || 0,
                ys_xepsay: 0,
                ys_vaolo: 0,
                ys_daralo: 0,
                tb_xepsay: 0,
                tb_vaolo: 0,
                tb_daralo: 0,
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
        getReportData;
    }, [fromDate, toDate, getReportData]);

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
            headerName: "Tên",
            field: "itemname",
            width: 350,
            suppressHeaderMenuButton: true,
        },
        {
            headerName: "Quy cách",
            children: [
                { headerName: "Dày", field: "thickness", width: 120 },
                { headerName: "Rộng", field: "width", width: 120 },
                { headerName: "Dài", field: "height", width: 120 },
            ],
        },
        {
            headerName: "Thuận Hưng",
            children: [
                {
                    headerName: "Xếp sấy",
                    field: "th_xepsay",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
                {
                    headerName: "Vào lò",
                    field: "th_vaolo",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
                {
                    headerName: "Ra lò",
                    field: "th_daralo",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
            ],
        },
        {
            headerName: "Yên Sơn 1",
            children: [
                {
                    headerName: "Xếp sấy",
                    field: "ys_xepsay",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
                {
                    headerName: "Vào lò",
                    field: "ys_vaolo",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
                {
                    headerName: "Ra lò",
                    field: "ys_daralo",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
            ],
        },
        {
            headerName: "Thái Bình",
            children: [
                {
                    headerName: "Xếp sấy",
                    field: "tb_xepsay",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
                {
                    headerName: "Vào lò",
                    field: "tb_vaolo",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
                {
                    headerName: "Ra lò",
                    field: "tb_daralo",
                    width: 120,
                    suppressHeaderMenuButton: true,
                },
            ],
        },
    ]);

    const onGridReady = useCallback(async () => {
        showLoading();
        const res = await reportApi.getCBGWoodDryingReport(
            format(fromDate, "yyyy-MM-dd"),
            format(toDate, "yyyy-MM-dd")
        );
        const formattedData = res.map((item) => ({
            itemname: item.ItemName,
            thickness: item.CDay,
            width: item.CRong,
            height: item.CDai,
            th_xepsay: item.sepxay || 0,
            th_vaolo: item.vaolo || 0,
            th_daralo: item.ralo || 0,
            ys_xepsay: 0,
            ys_vaolo: 0,
            ys_daralo: 0,
            tb_xepsay: 0,
            tb_vaolo: 0,
            tb_daralo: 0,
        }));
        setRowData(formattedData);
        hideLoading();
    }, []);

    const showLoading = useCallback(() => {
        gridRef?.current?.api?.showLoadingOverlay();
    }, []);

    const hideLoading = useCallback(() => {
        gridRef?.current?.api?.hideOverlay();
    }, []);

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
                                    Báo cáo sấy phôi
                                </div>
                                <div className=" text-2xl font-semibold">
                                    Báo cáo xếp sấy khối CBG
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
                            <div className="flex space-x-3 w-1/2">
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
                        </div>
                    </div>

                    {/* Content */}
                    {isDataReportLoading ? (
                        <div className="mt-2 bg-[#dbdcdd] flex items-center justify-center  p-2 px-4 pr-1 rounded-lg ">
                            {/* <div>Đang tải dữ liệu</div> */}
                            <div class="dots"></div>
                        </div>
                    ) : (
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
                                    onGridReady={onGridReady}
                                />
                            </div>
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

export default CBGWoodDryingReports;
