import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from typing import Dict, List
import threading

class QwenChatbot:
    """
    A chatbot that uses the Qwen model for generating responses.
    """

    def __init__(
        self, 
        model_name: str = "Qwen/Qwen3-1.7B", 
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ):
        self.device = device
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name).to(self.device)
        self.history = []

    def _generate_streamer(self, user_input: str, enable_thinking: bool = False):
        self.history.append({"role": "user", "content": user_input})

        # Wrap the history in a chat template
        text = self.tokenizer.apply_chat_template(
            self.history, 
            tokenize=False, 
            add_generation_prompt=True,
            enable_thinking=enable_thinking
        )

        # Tokenize the input text
        inputs = self.tokenizer(text, return_tensors="pt").to(self.device)

        # Create a streaming generator for the response
        streamer = TextIteratorStreamer(
            self.tokenizer, 
            skip_prompt=True, 
            skip_special_tokens=True
        )

        # # Generate a response
        # response_ids = self.model.generate(
        #     **inputs, 
        #     max_new_tokens=32768,
        #     pad_token_id=self.tokenizer.eos_token_id,
        # )[0]

        thread = threading.Thread(
            target=self.model.generate,
            kwargs={
                **inputs,
                "max_new_tokens": 32768,
                "pad_token_id": self.tokenizer.eos_token_id,
                "streamer": streamer
            }
        )
        thread.start()
        return streamer

        # # Decode the generated response and skip the prompt
        # gen_tokens = response_ids[len(inputs["input_ids"][0]):].tolist()

        # # parsing thinking content
        # try:
        #     # rindex finding 151668 (</think>)
        #     index = len(output_ids) - output_ids[::-1].index(151668)
        # except ValueError:
        #     index = 0

        # # Decode the output tokens
        # thinking_content = self.tokenizer.decode(gen_tokens[:index], skip_special_tokens=True).strip("\n")
        # content = self.tokenizer.decode(gen_tokens[index:], skip_special_tokens=True).strip("\n")

        # self.history.append({"role": "assistant", "content": content})
        # return content

    def generate_response_stream(
        self, 
        user_input: str, 
        enable_thinking: bool = False
    ):
        """
        Generate a response to the user input and return a streaming generator.
        
        Args:
            user_input (str): The input from the user.
            enable_thinking (bool): Whether to enable thinking mode.
        
        Returns:
            TextIteratorStreamer: A streaming generator for the response.
        """
        streamer = self._generate_streamer(user_input, enable_thinking)
        
        thinking_text = ""
        content_text = ""
        in_thinking = enable_thinking

        for token in streamer:
            if in_thinking:
                thinking_text += token
                if "</think>" in thinking_text:
                    in_thinking = False
                    before, after = thinking_text.split("</think>", 1)
                    yield {"type": "thinking", "token": before.strip()}
                    
                    content_chunk = after.strip()
                    if content_chunk:
                        content_text += content_chunk
                        yield {"type": "content", "token": content_chunk}

            else:
                content_text += token
                yield {"type": "content", "token": token}

        self.history.append({"role": "assistant", "content": content_text.strip()})

    def reset_history(self):
        self.history = []

    # def save_history(self, file_path: str):
    #     with open(file_path, 'w') as f:
    #         json.dump(self.history, f, indent=4)