import axios from "axios";
import { BACKEND_URL } from "../../config";
import CanvasWorkspace from "../../../components/CanvasWorkspace";

async function getRoomId(slug: string) {
    const res = await axios.get(`${BACKEND_URL}/canvas-room/${slug}`);
    return res.data.roomId;
}

export default async function RoomPage({ params }: { params: { slug: string } }) {

    const { slug } = params;
    const roomId = await getRoomId(slug);

    return <CanvasWorkspace params={{ roomId: String(roomId) }} />
}