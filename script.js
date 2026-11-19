
// ======================================
// QR STUDIO - NEON ROUNDED QR GENERATOR
// ======================================

const qrType = document.getElementById("qrType");
const inputArea = document.getElementById("inputArea");

const neonPreset = document.getElementById("neonPreset");
const qrColor = document.getElementById("qrColor");
const qrColorEnd = document.getElementById("qrColorEnd");
const bgColor = document.getElementById("bgColor");

const glowEffect = document.getElementById("glowEffect");

const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");

const qrContainer = document.getElementById("qrcode");
const statusMessage = document.getElementById("statusMessage");

let generatedCanvas = null;

// ======================================
// NEON COLOR PRESETS
// ======================================

const neonPresets = {
    blue: ["#0878ff", "#22ffff"],
    purple: ["#8b2cff", "#ff38d1"],
    green: ["#00ff88", "#00aaff"],
    sunset: ["#ff5a00", "#ff35a8"],
    rainbow: [
        "#ff1744",
        "#ff9100",
        "#ffee00",
        "#00e676",
        "#00b0ff",
        "#d500f9"
    ]
};

// ======================================
// UPDATE PRESET COLORS
// ======================================

neonPreset.addEventListener("change", function () {
    const colors = neonPresets[this.value];

    if (colors) {
        qrColor.value = colors[0];
        qrColorEnd.value = colors[colors.length - 1];
    }
});

qrColor.addEventListener("input", function () {
    neonPreset.value = "custom";
});

qrColorEnd.addEventListener("input", function () {
    neonPreset.value = "custom";
});

// ======================================
// DYNAMIC INPUT FIELDS
// ======================================

function createInput(label, placeholder, type = "text") {
    return `
        <label>${label}</label>
        <input
            type="${type}"
            placeholder="${placeholder}"
            autocomplete="off"
        >
    `;
}

function updateInputs() {
    const type = qrType.value;

    if (type === "url") {
        inputArea.innerHTML = createInput(
            "Website URL",
            "https://example.com",
            "url"
        );
    }

    else if (type === "text") {
        inputArea.innerHTML = createInput(
            "Enter Your Text",
            "Write something..."
        );
    }

    else if (type === "wifi") {
        inputArea.innerHTML =
            createInput("Wi-Fi Network Name", "My WiFi") +
            createInput("Wi-Fi Password", "Enter password", "password") +
            `
                <label>Security Type</label>
                <select id="wifiSecurity">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No Password</option>
                </select>
            `;
    }

    else if (type === "email") {
        inputArea.innerHTML =
            createInput("Email Address", "example@gmail.com", "email") +
            createInput("Email Subject", "Enter subject") +
            createInput("Email Message", "Enter message");
    }

    else if (type === "phone") {
        inputArea.innerHTML = createInput(
            "Phone Number",
            "+911234567890",
            "tel"
        );
    }
}

// ======================================
// ESCAPE WIFI DATA
// ======================================

function escapeWifi(value) {
    return value.replace(/([\\;,:"])/g, "\\$1");
}

// ======================================
// GET QR DATA
// ======================================

function getQRData() {
    const fields = inputArea.querySelectorAll("input");

    if (qrType.value === "wifi") {
        const ssid = fields[0].value.trim();
        const password = fields[1].value;

        const security = document.getElementById("wifiSecurity").value;

        if (!ssid) {
            alert("Please enter your Wi-Fi name.");
            return null;
        }

        if (security !== "nopass" && !password) {
            alert("Please enter your Wi-Fi password.");
            return null;
        }

        const escapedSSID = escapeWifi(ssid);
        const escapedPassword = escapeWifi(password);

        return `WIFI:T:${security};S:${escapedSSID};P:${security === "nopass" ? "" : escapedPassword};;`;
    }

    if (qrType.value === "email") {
        const email = fields[0].value.trim();
        const subject = fields[1].value;
        const message = fields[2].value;

        if (!email) {
            alert("Please enter an email address.");
            return null;
        }

        return (
            `mailto:${email}` +
            `?subject=${encodeURIComponent(subject)}` +
            `&body=${encodeURIComponent(message)}`
        );
    }

    if (qrType.value === "phone") {
        const phone = fields[0].value.trim();

        if (!phone) {
            alert("Please enter a phone number.");
            return null;
        }

        return `tel:${phone}`;
    }

    const value = fields[0].value.trim();

    if (!value) {
        alert("Please enter the required information.");
        return null;
    }

    if (qrType.value === "url") {
        try {
            const parsedURL = new URL(value);

            if (
                parsedURL.protocol !== "http:" &&
                parsedURL.protocol !== "https:"
            ) {
                throw new Error("Invalid protocol");
            }
        } catch (error) {
            alert("Please enter a valid website URL beginning with https:// or http://");
            return null;
        }
    }

    return value;
}

// ======================================
// HEX TO RGB
// ======================================

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

// ======================================
// COLOR GRADIENT
// ======================================

function interpolateColor(colors, position) {
    const scaled = position * (colors.length - 1);

    const index = Math.min(
        Math.floor(scaled),
        colors.length - 2
    );

    const localPosition = scaled - index;

    const first = hexToRgb(colors[index]);
    const second = hexToRgb(colors[index + 1]);

    return {
        r: Math.round(first.r + (second.r - first.r) * localPosition),
        g: Math.round(first.g + (second.g - first.g) * localPosition),
        b: Math.round(first.b + (second.b - first.b) * localPosition)
    };
}

// ======================================
// CHECK QR FINDER PATTERNS
// Keep the three corner markers square.
// ======================================

function isFinderPattern(row, col, count) {
    const topLeft = row < 7 && col < 7;

    const topRight = row < 7 && col >= count - 7;

    const bottomLeft = row >= count - 7 && col < 7;

    return topLeft || topRight || bottomLeft;
}

// ======================================
// CREATE ROUNDED NEON QR
// ======================================

function createNeonQR(qrInstance) {
    const qrMatrix = qrInstance._oQRCode;

    if (!qrMatrix) {
        throw new Error("QR matrix could not be accessed.");
    }

    const count = qrMatrix.getModuleCount();

    const finalCanvas = document.createElement("canvas");

    finalCanvas.width = 400;
    finalCanvas.height = 400;

    const ctx = finalCanvas.getContext("2d");

    // Four-module quiet zone around the QR.
    const moduleSize = 400 / (count + 8);
    const offset = moduleSize * 4;

    const colors = neonPresets[neonPreset.value]
        ? [...neonPresets[neonPreset.value]]
        : [qrColor.value, qrColorEnd.value];

    if (neonPreset.value === "custom") {
        colors[0] = qrColor.value;
        colors[1] = qrColorEnd.value;
    }

    // Background
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, 400, 400);

    // Draw QR modules
    function drawModules() {
        for (let row = 0; row < count; row++) {
            for (let col = 0; col < count; col++) {

                if (!qrMatrix.isDark(row, col)) {
                    continue;
                }

                const position = (
                    (col / Math.max(1, count - 1)) * 0.7 +
                    (row / Math.max(1, count - 1)) * 0.3
                );

                const color = interpolateColor(
                    colors,
                    position
                );

                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;

                const x = offset + col * moduleSize;
                const y = offset + row * moduleSize;

                if (isFinderPattern(row, col, count)) {

                    // Preserve square finder patterns.
                    ctx.fillRect(
                        x,
                        y,
                        moduleSize + 0.2,
                        moduleSize + 0.2
                    );

                } else {

                    // Rounded QR dots.
                    const radius = moduleSize * 0.42;

                    ctx.beginPath();

                    ctx.arc(
                        x + moduleSize / 2,
                        y + moduleSize / 2,
                        radius,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }
            }
        }
    }

    // Optional neon glow
    if (glowEffect.checked) {
        ctx.save();

        ctx.shadowColor = qrColor.value;
        ctx.shadowBlur = 12;

        drawModules();

        ctx.restore();
    }

    // Draw sharp modules on top of glow.
    drawModules();

    return finalCanvas;
}

// ======================================
// GENERATE QR CODE
// ======================================

function generateQR() {
    const data = getQRData();

    if (!data) {
        return;
    }

    if (typeof QRCode === "undefined") {
        alert("QR library could not load. Check your internet connection.");
        return;
    }

    generatedCanvas = null;
    qrContainer.innerHTML = "";

    statusMessage.textContent = "Generating your rounded neon QR code...";

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";

    try {
        const qrInstance = new QRCode(qrContainer, {
            text: data,
            width: 400,
            height: 400,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Wait for QRCode.js to render.
        setTimeout(function () {
            try {
                const sourceCanvas = qrContainer.querySelector("canvas");

                if (!sourceCanvas) {
                    throw new Error("QR canvas not found");
                }

                generatedCanvas = createNeonQR(qrInstance);

                qrContainer.innerHTML = "";

                generatedCanvas.style.width = "250px";
                generatedCanvas.style.height = "250px";
                generatedCanvas.style.maxWidth = "100%";
                generatedCanvas.style.display = "block";

                qrContainer.appendChild(generatedCanvas);

                statusMessage.textContent =
                    "✓ Your rounded neon QR code is ready!";

            } catch (error) {
                console.error(error);

                generatedCanvas = null;

                statusMessage.textContent =
                    "Could not create QR preview. Please try again.";
            }

            generateBtn.disabled = false;
            generateBtn.textContent = "✦ Generate QR Code";

        }, 150);

    } catch (error) {
        console.error(error);

        alert("Something went wrong while generating the QR code.");

        generateBtn.disabled = false;
        generateBtn.textContent = "✦ Generate QR Code";
    }
}

// ======================================
// DOWNLOAD QR CODE
// ======================================

function downloadQR() {
    if (!generatedCanvas) {
        alert("Please generate a QR code first!");
        return;
    }

    try {
        const link = document.createElement("a");

        link.download = "QR-Studio-Rounded-Neon.png";

        link.href = generatedCanvas.toDataURL("image/png");

        link.click();

    } catch (error) {
        alert("Unable to download the QR code.");
    }
}

// ======================================
// EVENT LISTENERS
// ======================================

qrType.addEventListener("change", updateInputs);

generateBtn.addEventListener("click", generateQR);

downloadBtn.addEventListener("click", downloadQR);

// ======================================
// INITIALIZE
// ======================================

updateInputs();
