import { useState, FormEvent, KeyboardEvent } from 'react';
import { SuggestedTopic } from '../../types';
import './ChatInput.css';

interface ChatInputProps {
	onSend: (message: string) => void;
	disabled?: boolean;
	suggestedTopics?: SuggestedTopic[];
	showSuggestions?: boolean;
}

/**
 * Chat input with optional suggested topics
 */
export function ChatInput({
	onSend,
	disabled = false,
	suggestedTopics = [],
	showSuggestions = false,
}: ChatInputProps) {
	const [input, setInput] = useState('');

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (input.trim() && !disabled) {
			onSend(input.trim());
			setInput('');
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleTopicClick = (topic: SuggestedTopic) => {
		if (!disabled) {
			onSend(topic.prompt);
		}
	};

	return (
		<div className="chat-input">
			{showSuggestions && suggestedTopics.length > 0 && (
				<div className="chat-input__suggestions">
					{suggestedTopics.map((topic) => (
						<button
							key={topic.id}
							type="button"
							className="chat-input__suggestion"
							onClick={() => handleTopicClick(topic)}
							disabled={disabled}
						>
							{topic.title}
						</button>
					))}
				</div>
			)}

			<form className="chat-input__form" onSubmit={handleSubmit}>
				<textarea
					className="chat-input__textarea"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask about your style..."
					disabled={disabled}
					rows={1}
				/>
				<button
					type="submit"
					className="chat-input__submit"
					disabled={disabled || !input.trim()}
				>
					Send
				</button>
			</form>
		</div>
	);
}
