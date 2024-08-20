# DRM System for eBooks - Hệ thống DRM cho eBooks

## Giới thiệu

Hệ thống quản lý quyền kỹ thuật số (DRM) cho ebook với mục tiêu bảo vệ nội dung số khỏi các hành vi sao chép trái phép, đồng thời đảm bảo rằng chỉ những người dùng được xác thực mới có quyền truy cập vào nội dung này. Hệ thống bao gồm các tính năng cơ bản của một trang web cộng đồng chia sẻ ebooks giữa những người dùng và các tính năng bảo mật quan trọng như quản lý quyền truy cập, ngăn chặn việc chia sẻ nội dung trái phép giữa các người dùng, và thu hồi quyền sử dụng đối với các ebook có thời hạn.

## Tính năng chính

### Phía User:

- Đăng ký, đăng nhập, quên mật khẩu.
- Đổi mật khẩu.
- Đăng tải nội dung Ebook.
- Xóa, sửa nội dung Ebook của mình.
- Xem thông tin chi tiết Ebook.
- Gửi yêu cầu truy cập Ebook.
- Duyệt yêu cầu truy cập Ebook.
- Từ chối yêu cầu truy cập Ebook.
- Sao chép khóa truy cập Ebook.
- Xóa yêu cầu truy cập Ebook.
- Truy cập xem Ebook trực tuyến (Chủ sở hữu/Người đọc truy cập xem Ebook).
- Xem thông tin cá nhân.
- Thay đổi thông tin cá nhân.
- Tìm kiếm Ebook.

### Phía Admin:

- Quản lý Ebook (Duyệt/Từ chối Ebook cho User).
- Xem Ebook của User trước khi xét duyệt Ebook cho User.
- Đăng tải, xóa, sửa, xem nội dung Ebook.
- Quản lý User (Xóa User khi User vi phạm chính sách).
- Quản lý Admin (Thêm Admin khi cần bổ sung thêm Admin/Xóa Admin khi Admin không còn quyền hạn - Chức năng dành cho Admin System).
- Quản lý yêu cầu (Chấp nhận/Từ chối yêu cầu truy cập ebook khi User gửi yêu cầu xem ebook do Admin đăng tải).

### Phía Server:

- Mã hóa AES-256 cho ebook.
- Quản lý khóa mã hóa với RSA.
- Xác thực người dùng bằng mã email và JWT.
- Hiển thị thông báo thành công với các thao tác hợp lệ của User và Admin.
- Hiển thị thông báo lỗi với các thao tác không hợp lệ của User và Admin.
- Lưu trữ các File Ebooks đã bị mã hóa.
- Cấp khóa truy cập cho người dùng khi chủ sở hữu duyệt yêu cầu.

## Cài đặt

### Yêu cầu hệ thống

- Node.js
- ExpressJS
- MongoDB

Connect link MongoDB: mongodb+srv://baodanh7302:Baodanh732002@drmsytemforebooks.kvzpykg.mongodb.net/?retryWrites=true&w=majority&appName=DRMSytemForEbooks

### Hướng dẫn cài đặt

1. Clone dự án từ GitHub:
   Link GitHub của đồ án:
   https://github.com/baodanh732002/DRM_System_for_Ebooks.git

   Sử dung Gitbash:
   git clone https://github.com/baodanh732002/DRM_System_for_Ebooks.git

2. Cài đặt các gói cần thiết:
   Gõ câu lệnh trên Terminal:
   npm install

3. Chạy dự án:
   Gõ câu lệnh trên Terminal:
   npm start run

## Hướng dẫn sử dụng

- Truy cập `http://localhost:8080` để truy cập và chuyển hướng đến giao diện web.

### Sử dụng chức năng User:

- Đăng ký: Tại giao diện trang đăng ký, người dùng nhập các thông tin như tên người dùng, email, số điện thoại, ngày sinh, mật khẩu, xác nhận mật khẩu và nhấn nút "Register".

- Quên mật khẩu: Tại giao diện quên mật khẩu, người dùng nhập email đã sử dụng để đăng ký tài khoản để xác thực mã OTP. Sau khi xác thực OTP thành công thì nguời dùng nhập mật khẩu mới, xác nhận lại mật khẩu mới và nhấn nút "Reset Password".

- Đăng nhập: Tại giao diện trang đăng nhập, người dùng nhập tên người dùng, mật khẩu và nhấn nút "Login".

- Đổi mật khẩu: Tại giao diện trang thông tin cá nhân, người dùng chọn vào nút "Change Password" sau đó nhập thông tin mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới và nhấn nút "Update".

- Thay đổi thông tin cá nhân: Tại giao diện trang thông tin cá nhân, người dùng chọn vào nút "Edit" sau đó thay đổi thông tin cá nhân cần cập nhật và nhấn nút "Update".

- Đăng xuất: Tại giao diện trang chủ, người dùng nhấn vào biểu tượng cánh cửa ở góc phải bên trên của màn hình để đăng xuất ứng dụng.

- Tìm kiếm Ebook: Tại giao diện trang chủ, người dùng nhập từ khóa liên quan đến Ebook vào thanh tìm kiếm trên header và nhấn vào biểu tượng tìm kiếm hoặc nhấn phím Enter.

- Thêm Ebook mới bên phía User: Tại giao diện trang My Ebooks, người dùng nhấn nút "New" trên thanh Sibebar để hiển thị form nhập thông tin Ebook. Sau đó người dùng nhập đầy đủ các thông tin của Ebook và nhấn nút "Submit".

- Cập nhật Ebook bên phía User: Tại giao diện trang chi tiết Ebook của người dùng (Chủ sở hữu), người dùng nhấn vào nút "Edit" để hiển thị form cập nhật thông tin. Sau đó người dùng thay đổi thông tin cần cập nhật và nhấn nút "Update".

- Xóa Ebook bên phía User: Tại giao diện trang chi tiết Ebook của người dùng (Chủ sở hữu), người dùng nhấn vào nút "Delete" và xác nhận xóa Ebook.

- Chấp nhận yêu cầu truy cập Ebook bên phía User: Tại giao diện trang thông báo, người dùng nhấn vào nút "Approve" của yêu cầu truy cập có trạng thái Pending ở bảng "Key Request" và xác nhận chấp nhận yêu cầu truy cập.

- Từ chối yêu cầu truy cập Ebook bên phía User: Tại giao diện trang thông báo, người dùng nhấn vào nút "Reject" của yêu cầu truy cập có trạng thái Pending ở bảng "Key Request" và xác nhận từ chối yêu cầu truy cập.

- Đọc Ebook (Chủ sở hữu): Tại giao diện trang chi tiết Ebook của người dùng (Chủ sở hữu), người dùng nhấn vào nút "View" để đọc Ebook.

- Sao chép khóa truy cập: Tại giao diện trang thông báo, người dùng nhấn vào nút "Copy Key" của yêu cầu truy cập có trạng thái Approved ở bảng "Your Request".

- Xóa yêu cầu truy cập: Tại giao diện trang thông báo, người dùng nhấn vào nút "Delete" của yêu cầu truy cập bất kì ở bảng "Your Request" và xác nhận xóa yêu cầu truy cập.

- Đọc Ebook (Người đọc): Tại giao diện trang chi tiết Ebook của người dùng (Người đọc), người dùng nhấn vào nút "Request Access" và chờ chủ sở hữu Ebook cho phép yêu cầu truy cập. Sau khi được chủ sở hữu cho phép truy cập và được hệ thống gửi khóa truy cập thì người dùng di chuyển qua trang thông báo để sao chép khóa truy cập Ebook. Cuối cùng thì người dùng quay lại trang chi tiết Ebook, nhấn vào nút "Access Ebook" để hiện modal nhập khóa truy cập, dán khóa truy cập đã sao chép vào ô nhập khóa và nhấn nút "Submit".

### Sử dung chức năng Admin:

Tài khoản Admin System:
`Username: AdminSystem
   `Password: Baodanh732002

- Thêm Ebook mới bên phía Admin: Tại giao diện trang quản lý Ebook, Admin nhấn vào nút "New" ở phía bên phải của Filter để hiển thị form nhập thông tin Ebook. Sau đó Admin nhập đầy đủ các thông tin của Ebook và nhấn nút "Submit".

- Cập nhật Ebook bên phía Admin: Tại giao diện trang chi tiết Ebook (Ebook do Admin đăng tải), Admin nhấn vào nút "Edit" để hiển thị form cập nhật thông tin. Sau đó Admin thay đổi thông tin cần cập nhật và nhấn nút "Update".

- Xóa Ebook bên phía Admin: Tại giao diện trang chi tiết Ebook (Ebook do Admin đăng tải), Admin nhấn vào nút "Delete" và xác nhận xóa Ebook.

- Duyệt nội dung Ebook của User: Tại giao diện trang chi tiết Ebook (Ebook do User đăng tải), Admin nhấn vào nút "Accept" và xác nhận duyệt Ebook.

- Từ chối nội dung Ebook của User: Tại giao diện trang chi tiết Ebook (Ebook do User đăng tải), Admin nhấn vào nút "Deny" và xác nhận từ chối Ebook.

- Xem Ebook của User (Review): Tại giao diện trang chi tiết Ebook (Ebook do User đăng tải), Admin nhấn vào nút "View" để chuyển qua trang xem Ebook.

- Xem Ebook của Admin (Chủ sở hữu): Tại giao diện trang chi tiết Ebook (Ebook do Admin đăng tải), Admin nhấn vào nút "View" để chuyển qua trang xem Ebook.

- Xóa User: Tại giao diện trang quản lý User, Admin nhấn vào nút "Delete" ở cột Action đối với những User vi phạm chính sách và xác nhận xóa User đó.

- Chấp nhận yêu cầu truy cập Ebook phía Admin: Tại giao diện trang quản lý yêu cầu truy cập Ebook, Admin nhấn vào nút "Approve" của yêu cầu truy cập có trạng thái Pending và xác nhận chấp nhận yêu cầu truy cập.

- Từ chối yêu cầu truy cập Ebook phía Admin: Tại giao diện trang quản lý yêu cầu truy cập Ebook, Admin nhấn vào nút "Reject" của yêu cầu truy cập có trạng thái Pending và xác nhận từ chối yêu cầu truy cập.

- Thêm Admin: Tại giao diện trang quản lý Admin, Admin nhấn vào nút "New" để hiển thị form nhập thông tin Admin mới. Sau đó Admin nhập đầy đủ các thông tin của Admin mới và nhấn nút "Submit".

- Xóa Admin: Tại giao diện trang quản lý Admin, Admin nhấn vào nút "Delete" ở cột Action đối với những Admin không còn quyền hạn và xác nhận xóa Admin đó.

## Liên hệ

Email: npb.danh@gmail.com
