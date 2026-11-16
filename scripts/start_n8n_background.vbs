' Script khoi dong n8n chay ngam 100% tren Windows (Khong hien cua so CMD)
Set WshShell = CreateObject("WScript.Shell")
' Chay lenh cmd khoi dong n8n o cong 5678 voi cua so an (0 = an, False = khong block)
WshShell.Run "cmd.exe /c npx n8n", 0, False

' Thong bao nhe cho nguoi dung
MsgBox "n8n da duoc khoi dong chay ngam tai cong 5678!" & vbCrLf & _
       "Ban co the truy cap vao: http://localhost:5678" & vbCrLf & _
       "He thong Dat Phu POS se tu dong ban du lieu ngam vao n8n.", _
       64, "Dat Phu Automation - n8n Running"
