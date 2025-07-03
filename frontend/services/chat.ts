import axiosClient from "@/lib/axiosClient";

export async function fetchAllChats() {
  const response = await axiosClient.get(`/chat/get_chats`);
  return response.data.chats;
}

export async function fetchChatMessages(chatId: number) {
  const response = await axiosClient.get(
    `/chat/get_messages?chat_id=${chatId}`
  );
  return response.data.messages;
}

export async function createNewChat(chatName?: string, firstMessage?: string) {
  const response = await axiosClient.post(`/chat/create_chat`, {
    chat_name: chatName,
    first_message: firstMessage,
  });
  return response.data.chat_id;
}

export async function deleteChat(chatId: number) {
  const response = await axiosClient.delete(
    `/chat/delete_chat?chat_id=${chatId}`
  );
  return response.data;
}

export async function updateChatName(chatId: number, newName: string) {
  const response = await axiosClient.put(
    `/chat/update_chat_name?chat_id=${chatId}&new_name=${encodeURIComponent(
      newName
    )}`
  );
  return response.data;
}
