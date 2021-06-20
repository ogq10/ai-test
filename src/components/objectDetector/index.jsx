import React, {useRef, useState} from 'react';
import styled from 'styled-components';
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl"
import * as cocoSsd from "@tensorflow-models/coco-ssd"

const ObjectDetectorContainer = styled.div`
display: flex;
flex-direction: column;
align-items: center;
`
const DetectorContainer = styled.div`
min-width: 200px;
height: 500px;
border-radius: 3px solid white;
display: flex;
align-items: center;
justify-content: center;
position: relative
`

const TargetImg = styled.div`
height: 100%;

`
const HiddenFileInput = styled.div`
display: none;
`
const SelectButton = styled.div`
  padding: 7px 10px;
  border: 2px solid transparent;
  background-color: #fff;
  color: #0a0f22;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  margin-top: 2em;
  cursor: pointer;
  transition: all 260ms ease-in-out;
  &:hover {
    background-color: transparent;
    border: 2px solid #fff;
    color: #fff;
  }
`;

const TargetBox = styled.div`
  position: absolute;
  left: ${({ x }) => x + "px"};
  top: ${({ y }) => y + "px"};
  width: ${({ width }) => width + "px"};
  height: ${({ height }) => height + "px"};

  border: 4px solid purple;
  background-color: transparent;

  &::before {
      content: "${({ classType, score }) => `${classType} ${score.toFixed(1)}%`}";
      font-weight: 500;
      font-size: 17px;
      position: absolute;
      top: -1.5rem;
      left: -5px;
      z-index: 20;
  }
`



export function ObjectDetector(props){
    const fileInputRef = useRef();
    const [imgData, setImgData] = useState(null);
    const [predictions, setPredictions] = useState([])
    const imageRef = useRef();
    const [isLoading, setLoading] = useState(false);

    const isEmptyPredictions = !predictions || predictions.length === 0; 


    const openFilePicker = () => {
        if(fileInputRef.current) fileInputRef.current.click();
    }

    const normalizePredictions = (predictions, imgSize) => {
        if(!predictions || !imgSize){
            return []
        }
        else if(!imageRef){
            return predictions || [];
        }
        else{
            return predictions.map((prediction) => {
                const { bbox } = prediction;
                const oldX = bbox[0];
                const oldY = bbox[1];
                const oldWidth = bbox[2];
                const oldHeight = bbox[3];

                const imgWidth = imageRef.current.width;
                const imgWidth = imageRef.current.height;

                const new_x = (oldX * imgWidth) / imgSize.width;
                const new_y = (oldY * imgHeight) / imgSize.height;
                const new_height = (oldHeight * imgHeight) / imgSize.height;
                const new_width = (oldWidth * imgWidth) / imgSize.width;

                return { ...prediction, bbox: [x, y, width, height] }

            })
        }
    }

    const readImage = (file) =>{
        return new Promise ((rs,rj) => {
            const fileReader = new FileReader();
            fileReader.onload = () => rs(fileReader.result)
            fileReader.onerror = () => rj(fileReader.error)
            fileReader.readAsDataURL(file)
        })
    }

    const onSelectImg = async (e) =>{
        setPredictions ([]);
        setLoading(true); 

        const file = e.target.files[0];
        const ImgData = await readImage(file);
        setImgData(imgData)
        
        const imageElement = document.createElement("img");
        imageElement.src = imgData;

        imageElement.onload = async () => {
            const imgSize = { width: imageElement.width, height: imageElement.height};
            await detectObjectsOnImage(imageElement, imgSize)

        }

        setLoading(false);
    }

    const detectObjectsOnImage = async (imageElement, imgSize) => {
        const model = cocoSsd.load( { });
        const predictions = await model.detect(imageElement, 6 );
        const normalizedPredictions = normalizePredictions(predictions, imgSize);
        setPredictions(normalizedPredictions);
        console.log("Predictions: ", predictions)

    }
    
    return (
    <ObjectDetectorContainer>
        <DetectorContainer>
            { imgData && <TargetImg src={imgData} ref={imageRef} />}
            {!isEmptyPredictions && 
                predictions.map((prediction, idx) => (
                    <TargetBox 
                        key={idx} 
                        x={prediction.bbox[0]} 
                        y={prediction.bbox[1]}
                        width={prediction.bbox[2]}
                        height={prediction.bbox[3]}
                        classType={prediction.class}
                        score={prediction.score} />))}
            
        </DetectorContainer>
        <ObjectDetector>iMG</ObjectDetector>
        <HiddenFileInput type="file" ref={fileInputRef} onChange={onSelectImg}/>
        <SelectButton onClick={openFilePicker}>
            {isLoading ? "Recognizing..." : "Select Image"}
        </SelectButton>
        </ObjectDetectorContainer>
        )
}
