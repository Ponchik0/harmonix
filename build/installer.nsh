; Custom NSIS script for Harmonix installer
; Удаляет старую версию программы, но сохраняет пользовательские данные

!macro customInit
  ; ============================================
  ; ОЧИСТКА КЕША (сохраняем пользовательские данные)
  ; ============================================
  
  DetailPrint "Очистка кеша и временных файлов..."
  
  ; Удаляем только кеш из LocalAppData
  RMDir /r "$LOCALAPPDATA\harmonix\Cache"
  RMDir /r "$LOCALAPPDATA\harmonix\Code Cache"
  RMDir /r "$LOCALAPPDATA\harmonix\GPUCache"
  RMDir /r "$LOCALAPPDATA\harmonix\DawnCache"
  RMDir /r "$LOCALAPPDATA\harmonix\Service Worker"
  RMDir /r "$LOCALAPPDATA\harmonix\blob_storage"
  RMDir /r "$LOCALAPPDATA\harmonix\Session Storage"
  
  RMDir /r "$LOCALAPPDATA\Harmonix\Cache"
  RMDir /r "$LOCALAPPDATA\Harmonix\Code Cache"
  RMDir /r "$LOCALAPPDATA\Harmonix\GPUCache"
  RMDir /r "$LOCALAPPDATA\Harmonix\DawnCache"
  RMDir /r "$LOCALAPPDATA\Harmonix\Service Worker"
  
  ; Удаляем старый updater
  RMDir /r "$LOCALAPPDATA\harmonix-updater"
  
  ; Удаляем кеш из AppData\Roaming (но НЕ трогаем config.json, Local Storage, IndexedDB)
  RMDir /r "$APPDATA\harmonix\Cache"
  RMDir /r "$APPDATA\harmonix\Code Cache"
  RMDir /r "$APPDATA\harmonix\GPUCache"
  RMDir /r "$APPDATA\Harmonix\Cache"
  RMDir /r "$APPDATA\Harmonix\Code Cache"
  RMDir /r "$APPDATA\Harmonix\GPUCache"
  
  DetailPrint "Кеш очищен. Пользовательские данные сохранены."
!macroend

!macro preInstall
  ; Проверяем выбранную папку установки ПЕРЕД установкой
  ${If} ${FileExists} "$INSTDIR\Harmonix.exe"
    DetailPrint "Найдена старая версия в $INSTDIR"
    MessageBox MB_YESNO "Обнаружена старая версия Harmonix в этой папке.$\n$\nУдалить старую версию перед установкой?$\n(Ваши настройки и данные будут сохранены)" /SD IDYES IDYES RemoveOld IDNO SkipRemove
    RemoveOld:
      DetailPrint "Удаление старой версии из $INSTDIR..."
      ; Удаляем все файлы кроме папки с данными пользователя
      Delete "$INSTDIR\Harmonix.exe"
      Delete "$INSTDIR\*.dll"
      Delete "$INSTDIR\*.pak"
      Delete "$INSTDIR\*.dat"
      Delete "$INSTDIR\*.bin"
      RMDir /r "$INSTDIR\locales"
      RMDir /r "$INSTDIR\resources"
      DetailPrint "Старая версия удалена."
    SkipRemove:
  ${EndIf}
!macroend

!macro customInstall
  DetailPrint "Установка Harmonix завершена!"
  DetailPrint "Ваши настройки и данные сохранены."
!macroend

!macro customUnInit
  ; При удалении программы спрашиваем что делать с данными
  MessageBox MB_YESNO "Удалить все пользовательские данные?$\n$\n• Настройки$\n• Плейлисты$\n• Статистику$\n• Оффлайн треки$\n$\nЕсли планируете переустановить - выберите 'Нет'" /SD IDNO IDYES RemoveAll IDNO KeepData
  
  RemoveAll:
    DetailPrint "Удаление всех данных..."
    RMDir /r "$LOCALAPPDATA\harmonix"
    RMDir /r "$LOCALAPPDATA\Harmonix"
    RMDir /r "$LOCALAPPDATA\harmonix-updater"
    RMDir /r "$APPDATA\harmonix"
    RMDir /r "$APPDATA\Harmonix"
    DetailPrint "Все данные удалены."
    Goto Done
  
  KeepData:
    DetailPrint "Пользовательские данные сохранены."
    ; Удаляем только кеш
    RMDir /r "$LOCALAPPDATA\harmonix\Cache"
    RMDir /r "$LOCALAPPDATA\harmonix\Code Cache"
    RMDir /r "$LOCALAPPDATA\harmonix\GPUCache"
    RMDir /r "$LOCALAPPDATA\Harmonix\Cache"
    RMDir /r "$LOCALAPPDATA\Harmonix\Code Cache"
    RMDir /r "$LOCALAPPDATA\Harmonix\GPUCache"
  
  Done:
!macroend
