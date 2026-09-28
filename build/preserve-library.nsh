; Version 0.13 and earlier kept references INSIDE the application directory.
; Preserve them before electron-builder invokes the previous uninstaller.
; No archive extraction and no dependency on files beside the new installer.
!macro customInit
  IfFileExists "$INSTDIR\resources\library\manifest.json" 0 bw_preserve_done
    DetailPrint "Preserving your existing offline references..."
    nsExec::ExecToLog '"$SYSDIR\robocopy.exe" "$INSTDIR\resources\library" "$LOCALAPPDATA\BlackWire\legacy-library" /E /R:1 /W:1 /XJ /NFL /NDL /NJH /NJS'
    Pop $R0
    ${If} $R0 == "error"
    ${OrIf} $R0 == "timeout"
    ${OrIf} $R0 >= 8
      MessageBox MB_OK|MB_ICONSTOP "Your existing offline library could not be preserved. Check free disk space and folder permissions, then try again. Your current installation has not been removed." /SD IDOK
      SetErrorLevel 8
      Quit
    ${EndIf}
  bw_preserve_done:
!macroend
