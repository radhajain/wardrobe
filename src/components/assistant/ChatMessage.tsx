import Markdown from 'react-markdown';
import { ChatMessage as ChatMessageType, ClothesWithId } from '../../types';
import './ChatMessage.css';

interface ChatMessageProps {
	message: ChatMessageType;
	wardrobe: ClothesWithId[];
}

/**
 * Renders a single chat message with optional item references
 */
export function ChatMessage({ message, wardrobe }: ChatMessageProps) {
	const isUser = message.role === 'user';

	// Get referenced items from wardrobe
	const referencedItems = message.itemReferences
		?.map((ref) => wardrobe.find((item) => item.id === ref.clothesId))
		.filter(Boolean) as ClothesWithId[] | undefined;

	// Format content - remove [ID:X] markers for cleaner display
	const formattedContent = message.content.replace(/\[ID:\d+\]/g, '');

	return (
		<div
			className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
		>
			<div className="chat-message__content">
				{isUser ? (
					<p className="chat-message__text">{formattedContent}</p>
				) : (
					<div className="chat-message__markdown">
						<Markdown>{formattedContent}</Markdown>
					</div>
				)}

				{referencedItems && referencedItems.length > 0 && (
					<div className="chat-message__items">
						<span className="chat-message__items-label">Referenced pieces:</span>
						<div className="chat-message__items-grid">
							{referencedItems.map((item) => (
								<div key={item.id} className="chat-message__item">
									{item.imageUrl && (
										<img
											src={item.imageUrl}
											alt={item.name}
											className="chat-message__item-image"
										/>
									)}
									<span className="chat-message__item-name">{item.name}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
