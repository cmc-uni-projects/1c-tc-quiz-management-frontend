import { NextResponse } from 'next/server';

export async function GET() {
  console.log('\n--- Bắt đầu kiểm tra kết nối backend ---');
  let publicApiResult = 'thất bại';
  let publicApiStatus = 'N/A';

  try {
    console.log('1. Đang kiểm tra kết nối đến API công khai (jsonplaceholder)...');
    const publicApiResponse = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    publicApiStatus = publicApiResponse.status.toString();
    if (publicApiResponse.ok) {
      publicApiResult = 'OK';
      console.log('=> Kết nối API công khai THÀNH CÔNG.');
    } else {
      console.error('=> Kết nối API công khai THẤT BẠI với status:', publicApiResponse.status);
    }
  } catch (error: any) {
    console.error('=> Lỗi khi gọi API công khai:', error.cause || error.message);
    publicApiResult = `thất bại với lỗi: ${error.name}`;
  }

  console.log('--------------------------------------------------');

  let backendApiResult = 'thất bại';
  let backendApiStatus = 'N/A';
  const BACKEND_URL = process.env.SPRING_BOOT_API_URL || 'http://localhost:8082';
  const backendUrl = `${BACKEND_URL}/api/test`;

  try {
    console.log(`2. Đang kiểm tra kết nối đến backend của bạn tại: ${backendUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout

    const backendResponse = await fetch(backendUrl, {
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    backendApiStatus = backendResponse.status.toString();

    if (backendResponse.ok) {
      backendApiResult = 'OK';
      console.log('=> Kết nối backend của bạn THÀNH CÔNG.');
    } else {
      backendApiResult = `thất bại với status: ${backendResponse.status}`;
      console.error('=> Kết nối backend của bạn THẤT BẠI với status:', backendResponse.status);
    }
  } catch (error: any) {
    const errorMessage = error.name === 'AbortError' ? 'Request timed out (quá 5 giây)' : (error.cause || error.message);
    console.error('=> Lỗi khi gọi backend của bạn:', errorMessage);
    backendApiResult = `thất bại với lỗi: ${error.name}`;
  }

  console.log('--- Kết thúc kiểm tra kết nối backend ---\n');

  return NextResponse.json({
    ket_qua_kiem_tra: {
      ket_noi_api_cong_khai: {
        ket_qua: publicApiResult,
        status: publicApiStatus,
      },
      ket_noi_backend_cua_ban: {
        url_da_goi: backendUrl,
        ket_qua: backendApiResult,
        status: backendApiStatus,
      }
    }
  });
}
