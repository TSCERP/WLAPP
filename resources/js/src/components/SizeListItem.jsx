import React from "react";
import { IoCloseSharp } from "react-icons/io5";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import palletsApi from "../api/palletsApi";
import toast from "react-hot-toast";

function SizeListItem(props) {
    const { id, size, reason, pallet, Qty, weight, onDelete, planID, onReload, onReloadPalletList } = props;

    const { isOpen, onOpen, onClose } = useDisclosure();

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const type = searchParams.get("type");

    const [size1, size2] = size.split('_')

    const handleDelete = () => {
      const deleteData  = {
          PlanID: planID,
          PalletID: id
      };

      try{
        palletsApi
          .deletePallet(deleteData)
          .then((response) => {
              toast.success("Xóa thành công.");
              onReload(planID);
              onReloadPalletList(reason);
              onClose();
              onDelete();
          })
      }catch(error){
        console.error("Lỗi khi gọi API:", error);
        toast.error("Hiện không thể xóa pallet, hãy thử lại sau.");
        onClose();
      }
          
  };

    return (
        <div className="relative bg-[#F9FAFB] border border-gray-200 rounded-xl h-[10rem] w-[13rem]">
            <div
                className={`absolute -top-1 -right-2.5 bg-gray-800 text-white w-6 h-6 items-center justify-center rounded-full cursor-pointer active:scale-[.84] active:duration-75 transition-all ${
                    type === "kt" || type === "vl" ? "flex" : "hidden"
                }`}
                onClick={onOpen}
            >
                <IoCloseSharp className="text-white" />
            </div>
            <Modal
                blockScrollOnMount={false}
                isOpen={isOpen}
                onClose={onClose}
                size="xs"
                isCentered
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Bạn có chắc muốn xóa pallet?</ModalHeader>
                    <ModalBody>
                        <div>
                            Sau khi bấm "Xác nhận", pallet sẽ bị xóa khỏi danh
                            sách.
                        </div>
                    </ModalBody>

                    <ModalFooter className="flex gap-x-3">
                        <button
                            onClick={onClose}
                            className="bg-gray-800 p-2 rounded-xl text-white px-4 active:scale-[.95] h-fit active:duration-75 transition-all xl:w-fit md:w-fit lg:w-fit w-full"
                        >
                            Đóng
                        </button>
                        <button
                            className="bg-[#155979] p-2 rounded-xl text-white px-4 active:scale-[.95] h-fit active:duration-75 transition-all xl:w-fit md:w-fit lg:w-fit w-full"
                            onClick={handleDelete}
                        >
                            Xác nhận
                        </button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <div className="hidden">{id}</div>

            <div className="font-medium p-4 py-3 border-b border-gray-200 w-full">
                {/* <div className="font-semibold"><span>{formatSizeQty(size)}</span></div> */}
                <div className="w-full"><span className="w-1/4">KT: </span> <span className="w-full">{size1}</span></div>
                {size2?<div className="w-full "><span className="w-1/4 text-transparent">KT: </span> <span className="w-full">{size2}</span></div>:null}
            </div>

            <div className="text-gray-600 space-y-2 py-3 p-4">
                {/* <div className="">Pallet: {pallet}</div> */}
                <div className="">SL: {Qty} (T)</div>
                <div className="">KL: {weight} (m³)</div>
            </div>
        </div>
    );
}

export default SizeListItem;
