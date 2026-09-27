!include "${BUILD_RESOURCES_DIR}\library-package.nsh"

; electron-builder resets SectionSetSize when installation mode changes.
; Include the external library in those values, not only the initial AddSize.
!ifdef APP_64_UNPACKED_SIZE
  !define /redef /math APP_64_UNPACKED_SIZE ${APP_64_UNPACKED_SIZE} + ${BW_LIBRARY_KIB}
!endif
!ifdef APP_32_UNPACKED_SIZE
  !define /redef /math APP_32_UNPACKED_SIZE ${APP_32_UNPACKED_SIZE} + ${BW_LIBRARY_KIB}
!endif
!ifdef APP_ARM64_UNPACKED_SIZE
  !define /redef /math APP_ARM64_UNPACKED_SIZE ${APP_ARM64_UNPACKED_SIZE} + ${BW_LIBRARY_KIB}
!endif

; Check before electron-builder uninstalls or replaces any existing version.
!macro BW_VerifyLibraryPart FILE SHA PART
  IfFileExists "$EXEDIR\${FILE}" bw_library_present_${PART}
    MessageBox MB_OK|MB_ICONSTOP "Download ${FILE} from the same Black Wire release and place it beside this installer. Keep all library ZIP parts unextracted, then run this installer again." /SD IDOK
    SetErrorLevel 2
    Quit
  bw_library_present_${PART}:
  ${StdUtils.HashFile} $R0 "SHA2-256" "$EXEDIR\${FILE}"
  ${If} $R0 != "${SHA}"
    MessageBox MB_OK|MB_ICONSTOP "The offline library is incomplete or does not match this installer. Download ${FILE} again from the same release. No existing installation has been changed." /SD IDOK
    SetErrorLevel 3
    Quit
  ${EndIf}
!macroend

!macro BW_ExtractLibraryPart FILE
  DetailPrint "Installing ${FILE}..."
  nsisunz::Unzip "$EXEDIR\${FILE}" "$INSTDIR\resources\library"
  Pop $R0
  ${If} $R0 != "success"
    MessageBox MB_OK|MB_ICONSTOP "The offline library could not be extracted. Check free disk space and permissions, then run the installer again. Details: $R0" /SD IDOK
    SetErrorLevel 4
    Abort
  ${EndIf}
!macroend

!macro customInit
  !insertmacro BW_VerifyLibraryParts
!macroend

!macro customInstall
  AddSize ${BW_LIBRARY_KIB}
  SetOutPath "$INSTDIR\resources\library"
  !insertmacro BW_ExtractLibraryParts
  ${StdUtils.HashFile} $R0 "SHA2-256" "$INSTDIR\resources\library\manifest.json"
  ${If} $R0 != "${BW_LIBRARY_MANIFEST_SHA256}"
    MessageBox MB_OK|MB_ICONSTOP "The installed library manifest could not be verified. Run the installer again before opening Black Wire." /SD IDOK
    SetErrorLevel 5
    Abort
  ${EndIf}
  SetOutPath "$INSTDIR"
!macroend
