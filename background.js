let selectedMenuItemId = null
let selectedText = null
let settings = {
    model: "text-davinci-003",
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    api_key: "apikeyhere"
}

const createContextMenu = (title) => {
    chrome.contextMenus.create({
        id: title.toLowerCase().split(" ").join("-"),
        title: title,
        contexts: ["browser_action", "selection"]
    })
}

const generatePrompt = () => {
    let prompt
    switch (selectedMenuItemId) {
        case "explain-selection":
            prompt = "Explain: '" + selectedText + "'"
            break
        case "complete-selection":
            prompt = selectedText
            break
        case "respond-to-selection":
            prompt = "Respond to this message: '" + selectedText + "'"
            break
        case "summerize-selection":
            prompt = "Summerize: '" + selectedText + "'"
            break
        case "translate-selection":
            // TODO: Add language selection to the settings on the popup.js file.
            prompt = "Translate into english: '" + selectedText + "'"
            break
        default:
            prompt = selectedText
            break
    }
    return prompt
}

const sendTabMessage = (message) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, message)
        }
    })
}

const generateRequestBody = (prompt) => {
    return JSON.stringify({ ...Object.fromEntries(Object.entries(settings).filter(([key]) => key != "api_key")), ...{ prompt: prompt } })
}

const handleAPIResponse = (json) => {
    let apiResult = json.choices[0].text

    if (selectedMenuItemId == null) {
        // send to popup.js
        chrome.runtime.sendMessage({
            type: 'prompt-response',
            data: apiResult
        })
    } else {
        // send to content.js
        sendTabMessage({ apiResult: apiResult })
    }
}

const handleAPIError = (error) => {
    sendTabMessage({ apiResult: "Error. Please retry." })
}

const executeAPICall = (prompt) => {
    fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + settings.api_key
        },
        body: generateRequestBody(prompt)
    })
        .then(response => response.json())
        .then(handleAPIResponse).catch(handleAPIError)
}

const setLoading = () => {
    if (selectedMenuItemId) {
        sendTabMessage({ apiResult: "loading" })
    }
}

const requestAPIResponse = () => {
    if (!selectedText) {
        return
    }

    setLoading()
    executeAPICall(generatePrompt())
}

const handleContextMenuClick = (info, tab) => {
    selectedMenuItemId = info.menuItemId
    requestAPIResponse()
}

const handleSettingsLoad = (storageResult) => {
    if (storageResult.settings) {
        setSettings(storageResult.settings)
    }
}

const setSettings = (newSettings) => {
    settings = {
        model: newSettings.model,
        temperature: parseFloat(newSettings.temperature),
        max_tokens: parseInt(newSettings.max_tokens),
        top_p: parseFloat(newSettings.top_p),
        frequency_penalty: parseFloat(newSettings.frequency_penalty),
        presence_penalty: parseFloat(newSettings.presence_penalty),
        api_key: newSettings.api_key
    }
}

const handleMessage = (message, sender, sendResponse) => {
    // TODO: Use a message type
    if (message.hasOwnProperty("selectedText")) {
        selectedText = message.selectedText
        if (!selectedText || selectedText === "") {
            sendTabMessage({ removeTooltip: true })
        }
    } else if (message.hasOwnProperty("model")) {
        setSettings(message)
    } else if (message.hasOwnProperty("retry")) {
        requestAPIResponse()
    } else if (message.hasOwnProperty("prompt")) {
        selectedText = message.prompt
        selectedMenuItemId = null
        requestAPIResponse()
    }
}

createContextMenu("Explain Selection")
createContextMenu("Complete Selection")
createContextMenu("Respond to Selection")
createContextMenu("Summerize Selection")
createContextMenu("Translate Selection")

chrome.contextMenus.onClicked.addListener(handleContextMenuClick)

chrome.storage.sync.get("settings", handleSettingsLoad)

chrome.runtime.onMessage.addListener(handleMessage)
