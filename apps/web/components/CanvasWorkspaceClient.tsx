"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export default function CanvasWorkspaceClient({ 
    elements,
    id
}: {
    elements: { elementData: string }[];
    id: string;
}) {
    const { socket, loading } = useSocket();
    const [canvasElements, setCanvasElements] = useState(elements);
    const [currentElementInput, setCurrentElementInput] = useState("");

    useEffect(() => {
        if (!loading && socket) {
            socket.send(JSON.stringify({
                type: "join_room",
                room_id: id
            }));

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                if (parsedData.type === "canvas_update") {
                    setCanvasElements(el => [...el, { elementData: parsedData.elementData }]);
                }
            };
        }
    }, [loading, socket, id]);

    return (
        <div className="p-4">
            <div className="space-y-2 mb-4">
                {canvasElements.map((el, i) => (
                    <div key={i} className="font-mono text-sm bg-neutral-900 p-2 rounded">
                        {el.elementData.toString()}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={currentElementInput} 
                    onChange={(e) => setCurrentElementInput(e.target.value)} 
                    placeholder="Enter element JSON" 
                    className="bg-neutral-800 text-white px-3 py-2 rounded flex-1 focus:outline-none"
                />
                <button 
                    onClick={() => {
                        if (socket && currentElementInput) {
                            socket.send(JSON.stringify({
                                type: "canvas_update",
                                room_id: id,
                                elementData: currentElementInput
                            }));
                            setCurrentElementInput("");
                        }
                    }}
                    className="bg-purple-600 px-4 py-2 rounded text-white font-semibold hover:bg-purple-500 transition-colors"
                >
                    Add Element
                </button>
            </div>
        </div>
    );
}
