' Project Board silent launcher: runs launch.bat without a console window.
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run """" & base & "\launch.bat""", 0, False
