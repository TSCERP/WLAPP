import React, { useEffect, useState, useRef, useMemo } from "react";
import Layout from "../../../layouts/layout";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import BOWCard from "../../../components/BOWCard";
import palletsApi from "../../../api/palletsApi";
import axios from "axios";
import toast from "react-hot-toast";
import { addDays, format, add } from "date-fns";
import moment from "moment";
import Loader from "../../../components/Loader";
import useAppContext from "../../../store/AppContext";
import { BiConfused } from "react-icons/bi";
import { IoIosArrowBack } from "react-icons/io";

function LoadIntoKiln() {
    const [loading, setLoading] = useState(true);
    const [bowCards, setBowCards] = useState([]);

    const { user } = useAppContext();
    const navigate = useNavigate();

    // Mini Loading When Loading Into Kiln
    const [miniLoading, setMiniLoading] = useState(false);

    useEffect(() => {
        palletsApi
            .getBOWList()

            .then((response) => {
                console.log("1. Load danh sách BOWCard:", response);

                setBowCards(response || []);

                console.log("hello: ", bowCards);
            })
            .catch((error) => {
                console.error("Error fetching BOWCard list:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <Layout>
            {/* Container */}
            <div className="flex justify-center bg-transparent">
                {/* Section */}
                <div className="w-screen  px-4 xl:p-12 lg:p-12 md:p-12 p-4 xl:px-32">
                    {/* Go back */}
                    <div 
                        className="flex items-center space-x-1 bg-[#DFDFE6] hover:cursor-pointer active:scale-[.95] active:duration-75 transition-all rounded-2xl p-1 w-fit px-3 text-sm font-medium text-[#17506B] mb-3 "
                        onClick={() => navigate(-1)}
                    >
                        <IoIosArrowBack />
                        <div>Quay lại</div>
                    </div>

                    {/* Header */}
                    <div className="serif text-4xl font-bold mb-6">Vào lò</div>

                    {/* BOWCard List */}
                    {(bowCards.Status === 0).length > 0 && (bowCards.Status === 1).length > 0 ? (
                    <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6">
                        {bowCards &&
                            bowCards.length > 0 &&
                            bowCards
                                ?.map(
                                    (bowCard, index) =>
                                        ((bowCard.Status === 1 ||
                                            bowCard.Status === 0) && bowCard.plant === user.plant) && (
                                            <BOWCard
                                                key={index}
                                                planID={bowCard.PlanID}
                                                status={bowCard.Status}
                                                batchNumber={bowCard.Code}
                                                kilnNumber={bowCard.Oven}
                                                thickness={bowCard.Method}
                                                purpose={bowCard.Reason}
                                                finishedDate={moment(
                                                    bowCard?.created_at
                                                )
                                                    .add(bowCard?.Time, "days")
                                                    .format(
                                                        "YYYY-MM-DD HH:mm:ss"
                                                    )}
                                                palletQty={bowCard.TotalPallet}
                                                weight={bowCard.Mass}
                                                isChecked={bowCard.Checked}
                                                isReviewed={bowCard.Review}
                                            />
                                        )
                                )
                                .reverse()}
                    </div>
                    ) : (
                        <>
                            {!loading && (
                                <div className="h-full mt-20 flex flex-col items-center justify-center text-center">
                                    <BiConfused className="text-center text-gray-400 w-12 h-12 mb-2"/>
                                    <div className="  text-xl text-gray-400"> 
                                        Tiến trình hiện tại không có hoạt động nào.
                                    </div>
                                </div>
                            )}        
                        </>
                    )}
                </div>
            </div>
            {loading && <Loader />}
        </Layout>
    );
}

export default LoadIntoKiln;
