!macro preInit
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customHeader
    !system "echo ''
!macroend

!macro customInit
    !system "echo ''
!macroend

!macro customInstall
    !system "echo ''
!macroend

!macro customUnInit
    !system "echo ''
!macroend

!macro customInstallMode
    !system "echo ''
!macroend
