-- Delay for 1 second
delay 0.5


-- Simulate pressing Ctrl+Shift+Alt+Cmd+U
tell application "System Events"
    keystroke "u" using {control down, shift down, option down, command down}
end tell

delay 0.8

-- Perform paste operation (Command+V)
tell application "System Events"
    keystroke "v" using {command down}
end tell


delay 0.5

-- Simulate pressing Cmd+Shift+I
tell application "System Events"
    keystroke "i" using {command down, shift down}
end tell

delay 0.5
