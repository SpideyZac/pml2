let loadingDiv: HTMLDivElement;
let loadingUI: HTMLDivElement;

let loadingText: HTMLParagraphElement;

let loadingBarOuter: HTMLDivElement;
let loadingBarInner: HTMLDivElement;
let loadingBarFill: HTMLDivElement;

let progressDiv: HTMLDivElement;

let total: number;
const current = {
    num: 0,
    text: undefined,
    url: "",
    version: "",

    totalParts: 0,
    part: 0,
};

export function setCurrentTotalParts(parts: number) {
    current.totalParts = parts;
}

export function startLoadingScreen(mods: number) {
    const ui = document.getElementById("ui")!;

    loadingDiv = document.createElement("div");
    loadingDiv.style.display = "flex";
    loadingDiv.style.flexDirection = "column";
    loadingDiv.style.position = "absolute";
    loadingDiv.style.left = "0";
    loadingDiv.style.top = "0";
    loadingDiv.style.width = "100%";
    loadingDiv.style.height = "100%";
    loadingDiv.style.textAlign = "center";
    loadingDiv.style.backgroundColor = "#192042";
    loadingDiv.style.transition = "background-color 1s ease-out";
    loadingDiv.style.overflow = "hidden";

    loadingDiv.innerHTML = `<img src="https://pml.crjakob.com/polytrackmods/PolyModLoader/0.5.0/images/pmllogo.svg" style="width: calc(100vw * (1000 / 1300)); height: 200px; margin: 30px auto 0 auto" />`;

    loadingUI = document.createElement("div");
    loadingUI.style.margin = "20px 0 0 0";
    loadingUI.style.padding = "0";

    loadingText = document.createElement("p");
    loadingText.innerText = "[PML] Loading Mods...";
    loadingText.style.margin = "5px";
    loadingText.style.padding = "0";
    loadingText.style.color = "#ffffff";
    loadingText.style.fontSize = "32px";
    loadingText.style.fontStyle = "italic";
    loadingText.style.fontFamily = "ForcedSquare, Arial, sans-serif";
    loadingText.style.lineHeight = "1";

    loadingBarOuter = document.createElement("div");
    loadingBarOuter.style.margin = "0 auto";
    loadingBarOuter.style.padding = "0";
    loadingBarOuter.style.width = "600px";
    loadingBarOuter.style.height = "50px";
    loadingBarOuter.style.backgroundColor = "#28346a";
    loadingBarOuter.style.clipPath = "polygon(9px 0, 100% 0, calc(100% - 9px) 100%, 0 100%)";
    loadingBarOuter.style.overflow = "hidden";

    loadingBarInner = document.createElement("div");
    loadingBarInner.style.margin = "15px 20px";
    loadingBarInner.style.padding = "0";
    loadingBarInner.style.width = "560px";
    loadingBarInner.style.height = "20px";
    loadingBarInner.style.clipPath = "polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)";
    loadingBarInner.style.backgroundColor = "#222244";
    loadingBarInner.style.boxShadow = "inset 0 0 6px #000000";

    loadingBarFill = document.createElement("div");
    loadingBarFill.style.margin = "0";
    loadingBarFill.style.padding = "0";
    loadingBarFill.style.width = "0";
    loadingBarFill.style.height = "100%";
    loadingBarFill.style.clipPath = "polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)";
    loadingBarFill.style.backgroundColor = "#ffffff";
    loadingBarFill.style.boxShadow = "inset 0 0 6px #000000";
    loadingBarFill.style.transition = "width 0.1s ease-in-out";

    progressDiv = document.createElement("div");
    progressDiv.style.textAlign = "left";
    progressDiv.style.width = "1000px";
    progressDiv.style.margin = "50px auto";

    loadingBarOuter.appendChild(loadingBarInner);
    loadingBarInner.appendChild(loadingBarFill);

    loadingUI.appendChild(loadingText);
    loadingUI.appendChild(loadingBarOuter);
    loadingUI.appendChild(progressDiv);

    loadingDiv.appendChild(loadingUI);
    ui.appendChild(loadingDiv);

    total = mods;
}

export function updateBar(num: number) {
    current.num = num;
    loadingBarFill.style.width = `${(current.num / total) * 100}%`;
}
export function nextPart() {
    updateBar(current.num + current.part / current.totalParts);
    current.part += 1;
}
export function currPartStr() {
    return `[${current.part}/${current.totalParts}]`;
}
export function startImportMod(url: string, version: string) {
    current.url = url;
    current.version = version;

    progressDiv.innerHTML = "";
    const modP = document.createElement("p");
    modP.innerText = "[PML] Loading Mods...";
    modP.style.color = "#ffffff";
    modP.style.fontSize = "18px";
    modP.style.fontStyle = "italic";
    modP.style.fontFamily = "ForcedSquare, Arial, sans-serif";
    modP.style.lineHeight = "1";
    modP.innerText = `Importing mod from URL: ${current.url} @ version ${current.version}`;

    progressDiv.appendChild(modP);
    // @ts-ignore
    current.text = modP;
}
export function startFetchLatest() {
    nextPart();

    const latestP = document.createElement("p");
    latestP.style.color = "#ffffff";
    latestP.style.fontSize = "18px";
    latestP.style.fontStyle = "italic";
    latestP.style.fontFamily = "ForcedSquare, Arial, sans-serif";
    latestP.style.lineHeight = "1";
    latestP.innerText = `${currPartStr()} Fetching latest mod version from ${current.url}/latest.json`;

    progressDiv.appendChild(latestP);
    // @ts-ignore
    current.text = latestP;
}
export function finishFetchLatest(version: string) {
    current.version = version;
    // @ts-ignore
    current.text.innerText = `${currPartStr()} Fetched latest mod version: v${current.version}`;
}
export function startFetchManifest() {
    nextPart();

    const manifestP = document.createElement("p");
    manifestP.style.color = "#ffffff";
    manifestP.style.fontSize = "18px";
    manifestP.style.fontStyle = "italic";
    manifestP.style.fontFamily = "ForcedSquare, Arial, sans-serif";
    manifestP.style.lineHeight = "1";
    manifestP.innerText = `${currPartStr()} Fetching mod manifest from ${current.url}/${current.version}/manifest.json`;

    progressDiv.appendChild(manifestP);
    // @ts-ignore
    current.text = manifestP;
}
export function startFetchModMain(js: string) {
    nextPart();

    const mainP = document.createElement("p");
    mainP.style.color = "#ffffff";
    mainP.style.fontSize = "18px";
    mainP.style.fontStyle = "italic";
    mainP.style.fontFamily = "ForcedSquare, Arial, sans-serif";
    mainP.style.lineHeight = "1";
    mainP.innerText = `${currPartStr()} Fetching mod js from ${current.url}/${current.version}/${js}`;

    progressDiv.appendChild(mainP);
    // @ts-ignore
    current.text = mainP;
}

export function finishImportMod() {
    current.totalParts = 0;
    current.part = 0;
    updateBar(Math.floor(current.num) + 1);
}
export function errorCurrent() {
    // @ts-ignore
    current.text.style.color = "red";
}

export function endLoadingScreen() {
    loadingDiv.remove();
}
