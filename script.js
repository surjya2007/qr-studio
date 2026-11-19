
const qrType = document.getElementById("qrType");
const inputArea = document.getElementById("inputArea");
const qrInput = document.getElementById("qrInput");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const qrContainer = document.getElementById("qrcode");

let qrCode = null;

function createInput(label, placeholder, type = "text") {
    return `
        <label>${label}</label>
        <input type="${type}" placeholder="${placeholder}">
    `;
}

function updateInputs() {
    const type = qrType.value;

    if (type === "url") {
        inputArea.innerHTML = createInput(
            "Enter Website URL", "https://example.com"
        );
    }

    else if (type === "text") {
        inputArea.innerHTML = createInput(
            "Enter Your Text", "Write something..."
        );
    }

    else if (type === "wifi") {
        inputArea.innerHTML =
            createInput("Wi-Fi Name (SSID)", "My WiFi") +
            createInput("Wi-Fi Password", "Password", "password") +
            createInput("Security", "WPA");
    }

    else if (type === "email") {
        inputArea.innerHTML =
            createInput("Email Address", "example@gmail.com", "email") +
            createInput("Subject", "Enter subject") +
            createInput("Message", "Enter message");
    }

    else if (type === "phone") {
        inputArea.innerHTML = createInput(
            "Phone Number", "+911234567890", "tel"
        );
    }
}

function getQRData() {
    const fields = inputArea.querySelectorAll("input");

    if (qrType.value === "wifi") {
        const ssid = fields[0].value.trim();
        const password = fields[1].value;
        const security = fields[2].value.trim() || "WPA";

        if (!ssid) return null;

        const escapedSSID = ssid.replace(/([\\;,:"])/g, "\\$1");
        const escapedPassword = password.replace(/([\\;,:"])/g, "\\$1");

        return `WIFI:T:${security};S:${escapedSSID};P:${escapedPassword};;`;
    }

    if (qrType.value === "email") {
        const email = fields[0].value.trim();
        const subject = fields[1].value;
        const message = fields[2].value;

        if (!email) return null;

        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    }

    if (qrType.value === "phone") {
        const phone = fields[0].value.trim();

        if (!phone) return null;

        return `tel:${phone}`;
    }

    const value = fields[0].value.trim();

    if (!value) return null;

    if (qrType.value === "url" &&
        !/^https?:\/\/.+/i.test(value)) {
        alert("Please enter a valid URL starting with http:// or https://");
        return null;
    }

    return value;
}

function generateQR() {
    const data = getQRData();

    if (!data) {
        alert("Please fill in the required fields!");
        return;
    }

    qrContainer.innerHTML = "";

    try {
        qrCode = new QRCode(qrContainer, {
            text: data,
            width: 200,
            height: 200,
            colorDark: document.getElementById("qrColor").value,
            colorLight: document.getElementById("bgColor").value,
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (error) {
        alert("Could not generate QR code. Please check your input.");
    }
}

function downloadQR() {
    const canvas = qrContainer.querySelector("canvas");

    if (canvas) {
        const link = document.createElement("a");
        link.download = "QR-Studio.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
    }

    const image = qrContainer.querySelector("img");

    if (image) {
        const link = document.createElement("a");
        link.download = "QR-Studio.png";
        link.href = image.src;
        link.click();
        return;
    }

    alert("Please generate a QR code first!");
}

qrType.addEventListener("change", updateInputs);
generateBtn.addEventListener("click", generateQR);
downloadBtn.addEventListener("click", downloadQR);

updateInputs();

