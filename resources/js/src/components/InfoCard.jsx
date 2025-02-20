import React from "react";
import { FaCircleInfo } from "react-icons/fa6";

function InfoCard(props) {
    
    const { purpose, thickness, finishedDate, palletQty, weight} = props;

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-300 h-fit">
            <div className="flex items-center gap-x-2 font-medium border-b p-3 px-4 border-gray-200">
              <div className="w-8 h-8">
                <FaCircleInfo className="text-[#17506B] w-[85%] h-full"/>
              </div>
              
              <div className="serif xl:text-2xl xl:w-full text-2xl font-bold">Thông tin mẻ sấy</div>
            </div>
            
            <div className="space-y-3 px-6 pb-4 pt-4 ">
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Mục đích sấy:</div>
                    <span className="font-normal">{purpose}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Chiều dày sấy:</div>
                    <span>{thickness}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Ngày ra lò dự kiến:</div>
                    <span>{finishedDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Tổng số pallet:</div>
                    <span>{palletQty}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Tổng khối lượng:</div>
                    <div>
                        {weight} <span>{"(m³)"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InfoCard;
