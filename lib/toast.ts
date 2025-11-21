import toast from "react-hot-toast";

/**
 * Hiển thị thông báo (toast) và đảm bảo chỉ có một thông báo hiển thị tại một thời điểm.
 * @param message Nội dung thông báo.
 * @param type Loại thông báo ('success' hoặc 'error').
 * @param duration Thời gian hiển thị (tùy chọn, mặc định là 3000ms).
 */
const showToast = (
  message: string,
  type: "success" | "error",
  duration: number = 3000
) => {
  // Ẩn tất cả các toast hiện có
  toast.dismiss();

  // Hiển thị toast mới
  if (type === "success") {
    toast.success(message, { duration });
  } else {
    toast.error(message, { duration });
  }
};

export const toastSuccess = (message: string, duration?: number) => {
  showToast(message, "success", duration);
};

export const toastError = (message: string, duration?: number) => {
  showToast(message, "error", duration);
};
