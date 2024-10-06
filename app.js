import {
  ObjectDetector,
  FilesetResolver,
  Detection,
  ObjectDetectionResult
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// Initial setup
const demosSection = document.getElementById("demos") as HTMLElement;
let objectDetector: ObjectDetector;
let runningMode = "IMAGE";

// Initialize object detector
const initializeObjectDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );
  objectDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
      delegate: "GPU"
    },
    scoreThreshold: 0.5,
    runningMode: runningMode
  });
  demosSection.classList.remove("invisible");
};
initializeObjectDetector();

// Detect objects in images
const imageContainers = document.getElementsByClassName("detectOnClick") as HTMLDivElement[];
for (let imageContainer of imageContainers) {
  imageContainer.children[0].addEventListener("click", handleClick);
}

async function handleClick(event) {
  // Clear previous detections
  const highlighters = event.target.parentNode.getElementsByClassName("highlighter");
  while (highlighters[0]) highlighters[0].parentNode.removeChild(highlighters[0]);

  if (!objectDetector) {
    alert("Object Detector is still loading.");
    return;
  }

  // Detect objects
  const detections = await objectDetector.detect(event.target);
  displayImageDetections(detections, event.target);
}

function displayImageDetections(result: ObjectDetectionResult, resultElement: HTMLElement) {
  const ratio = resultElement.height / resultElement.naturalHeight;
  for (let detection of result.detections) {
    const p = document.createElement("p");
    p.innerText = detection.categories[0].categoryName + " - " + Math.round(detection.categories[0].score * 100) + "% confidence.";
    p.style = `left: ${detection.boundingBox.originX * ratio}px; top: ${detection.boundingBox.originY * ratio}px; width: ${(detection.boundingBox.width * ratio - 10)}px;`;

    const highlighter = document.createElement("div");
    highlighter.setAttribute("class", "highlighter");
    highlighter.style = `left: ${detection.boundingBox.originX * ratio}px; top: ${detection.boundingBox.originY * ratio}px; width: ${detection.boundingBox.width * ratio}px; height: ${detection.boundingBox.height * ratio}px;`;

    resultElement.parentNode.appendChild(highlighter);
    resultElement.parentNode.appendChild(p);
  }
}

// Detect objects in video (webcam)
let video = document.getElementById("webcam");
let enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  enableWebcamButton.addEventListener("click", enableCam);
}

async function enableCam() {
  const constraints = { video: true };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  video.addEventListener("loadeddata", predictWebcam);
}

async function predictWebcam() {
  const detections = await objectDetector.detectForVideo(video, performance.now());
  displayVideoDetections(detections);
  window.requestAnimationFrame(predictWebcam);
}

function displayVideoDetections(result: ObjectDetectionResult) {
  const liveView = document.getElementById("liveView");
  // Clear previous detections
  liveView.innerHTML = "";
  for (let detection of result.detections) {
    const highlighter = document.createElement("div");
    highlighter.style = `left: ${detection.boundingBox.originX}px; top: ${detection.boundingBox.originY}px; width: ${detection.boundingBox.width}px; height: ${detection.boundingBox.height}px;`;
    liveView.appendChild(highlighter);
  }
}
