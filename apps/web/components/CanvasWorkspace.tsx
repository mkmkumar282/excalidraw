import axios from "axios";
import { BACKEND_URL } from "../app/config";
import CanvasWorkspaceClient from "./CanvasWorkspaceClient";

async function getCanvasElements(roomId: string) {
  try {
    const res = await axios.get(`${BACKEND_URL}/elements/${roomId}`);
    return res.data.elements || [];
  } catch (e) {
    console.error("Failed to fetch canvas elements:", e);
    return [];
  }
}

export default async function CanvasWorkspace({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const elements = await getCanvasElements(roomId);

  return <CanvasWorkspaceClient id={roomId} elements={elements} />;
}
