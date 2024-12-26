-- Delay for 1 second
delay 0.75

-- Simulate pressing Cmd+I
tell application "System Events"
    keystroke "i" using {command down}
end tell

delay 1.5

-- Simulate pressing Cmd+N
tell application "System Events"
    keystroke "n" using {command down}
end tell

delay 0.5

-- Perform paste operation (Command+V)
tell application "System Events"
    keystroke "v" using {command down}
end tell

delay 0.5

-- Simulate pressing Enter
tell application "System Events"
    key code 36
end tell

delay 0.5
