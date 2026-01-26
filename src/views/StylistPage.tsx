import { useState, useEffect, useRef } from 'react';
import { useWardrobe } from '../hooks/useWardrobe';
import { useStyleChat, SUGGESTED_TOPICS } from '../hooks/useStyleChat';
import { ChatMessage } from '../components/assistant/ChatMessage';
import { ChatInput } from '../components/assistant/ChatInput';
import { StyleAssessment } from '../components/assistant/StyleAssessment';
import { MemoryBankModal } from '../components/assistant/MemoryBankModal';
import { getAssessmentResponses } from '../services/memoryBank';
import './StylistPage.css';

/**
 * Style assistant page with full chat interface
 */
export function StylistPage() {
	const { items, loading: wardrobeLoading } = useWardrobe();
	const { messages, isLoading, error, sendMessage, regenerateMessage, clearChat } =
		useStyleChat(items);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [showAssessment, setShowAssessment] = useState(false);
	const [showMemoryBank, setShowMemoryBank] = useState(false);
	const [hasAssessment, setHasAssessment] = useState(false);

	// Check if user has completed assessment
	useEffect(() => {
		const assessment = getAssessmentResponses();
		setHasAssessment(!!assessment);
	}, [showAssessment]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const showSuggestions = messages.length === 0;

	if (wardrobeLoading) {
		return (
			<div className="stylist-page">
				<div className="stylist-page__loading">Loading wardrobe...</div>
			</div>
		);
	}

	if (showAssessment) {
		return (
			<StyleAssessment
				onComplete={() => setShowAssessment(false)}
				onCancel={() => setShowAssessment(false)}
			/>
		);
	}

	return (
		<div className="stylist-page">
			<div className="stylist-page__header">
				<h1 className="stylist-page__title">Style Assistant</h1>
				<div className="stylist-page__header-actions">
					<button
						className="stylist-page__memory-btn"
						onClick={() => setShowMemoryBank(true)}
						title="View stored memories"
					>
						Memory
					</button>
					<button
						className="stylist-page__assessment-btn"
						onClick={() => setShowAssessment(true)}
					>
						{hasAssessment ? 'View Profile' : 'Take Assessment'}
					</button>
					{messages.length > 0 && (
						<button
							className="stylist-page__clear"
							onClick={clearChat}
							disabled={isLoading}
						>
							Clear Chat
						</button>
					)}
				</div>
			</div>
			<div className="stylist-page__messages-container">
				<div className="stylist-page__messages">
					{messages.length === 0 && (
						<div className="stylist-page__empty">
							<p className="stylist-page__empty-text">
								Your personal style advisor. Ask me anything about your
								wardrobe, style direction, or how to put together outfits.
							</p>
						</div>
					)}

					{messages.map((message) => (
						<ChatMessage
							key={message.id}
							message={message}
							wardrobe={items}
							onRedo={regenerateMessage}
							isLoading={isLoading}
						/>
					))}

					{isLoading && (
						<div className="stylist-page__typing">
							<span className="stylist-page__typing-dot"></span>
							<span className="stylist-page__typing-dot"></span>
							<span className="stylist-page__typing-dot"></span>
						</div>
					)}

					{error && <div className="stylist-page__error">{error}</div>}

					<div ref={messagesEndRef} />
				</div>
			</div>

			<ChatInput
				onSend={sendMessage}
				disabled={isLoading}
				suggestedTopics={SUGGESTED_TOPICS}
				showSuggestions={showSuggestions}
			/>

			{showMemoryBank && (
				<MemoryBankModal onClose={() => setShowMemoryBank(false)} />
			)}
		</div>
	);
}
