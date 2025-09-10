!macro preInit
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customHeader
!macroend

!macro customInit
!macroend

!macro customInstall
!macroend

!macro customUnInit
!macroend

!macro customInstallMode
    !insertMacro setCustomInstallMode
!macroend

!define setCustomInstallMode
    StrCpy $isForceCurrentInstall "1"
    StrCpy $isForceCurrentInstallMultiUser "0"
    StrCpy $isForceAllUsers "0"
    StrCpy $isForceAllUsersAvailable "0"
!macroend
