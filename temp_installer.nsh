!macro customInstall
  ; Register Prizm as default browser
  WriteRegStr HKCR "http\shell\open\command" "" '"$INSTDIR\${APP_EXEC}" "%1"'
  WriteRegStr HKCR "https\shell\open\command" "" '"$INSTDIR\${APP_EXEC}" "%1"'
  WriteRegStr HKCR "PrizmHTML" "" "Prizm HTML Document"
  WriteRegStr HKCR "PrizmHTML\shell\open\command" "" '"$INSTDIR\${APP_EXEC}" "%1"'
  WriteRegStr HKCR ".html\OpenWithProgIds" "PrizmHTML" ""
  WriteRegStr HKCR ".htm\OpenWithProgIds" "PrizmHTML" ""
  
  ; Refresh shell
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; Clean up registry entries
  DeleteRegKey HKCR "PrizmHTML"
  DeleteRegValue HKCR ".html\OpenWithProgIds" "PrizmHTML"
  DeleteRegValue HKCR ".htm\OpenWithProgIds" "PrizmHTML"
  
  ; Reset default browser if it was Prizm
  ReadRegStr $0 HKCR "http\shell\open\command" ""
  StrCpy $1 '"$INSTDIR\${APP_EXEC}" "%1"'
  StrCmp $0 $1 0 +2
  DeleteRegValue HKCR "http\shell\open\command" ""
  
  ReadRegStr $0 HKCR "https\shell\open\command" ""
  StrCmp $0 $1 0 +2
  DeleteRegValue HKCR "https\shell\open\command" ""
!macroend
