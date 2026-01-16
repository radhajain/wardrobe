import { getMemoryBank, getAssessmentResponses } from '../../services/memoryBank';
import './MemoryBankModal.css';

interface MemoryBankModalProps {
	onClose: () => void;
}

/**
 * Modal showing the user's stored memories and reflections
 */
export function MemoryBankModal({ onClose }: MemoryBankModalProps) {
	const memoryBank = getMemoryBank();
	const assessment = getAssessmentResponses();

	const hasReflections = memoryBank.reflections !== null;
	const hasAssessment = assessment !== null;
	const hasQueries = memoryBank.queries.length > 0;

	return (
		<div className="memory-modal-overlay">
			<div className="memory-modal">
				<div className="memory-modal__header">
					<h2 className="memory-modal__title">Your Style Memory</h2>
					<button className="memory-modal__close" onClick={onClose}>
						&times;
					</button>
				</div>

				<div className="memory-modal__content">
					<p className="memory-modal__intro">
						This is what I remember about you and your style preferences. This
						context helps me provide more personalized advice.
					</p>

					{hasAssessment && (
						<section className="memory-modal__section">
							<h3 className="memory-modal__section-title">Style Profile</h3>
							<div className="memory-modal__profile">
								{assessment.summary.split('\n\n').map((paragraph, i) => (
									<p key={i}>{paragraph}</p>
								))}
							</div>
							<span className="memory-modal__date">
								Completed {new Date(assessment.completedAt).toLocaleDateString()}
							</span>
						</section>
					)}

					{hasReflections && memoryBank.reflections && (
						<section className="memory-modal__section">
							<h3 className="memory-modal__section-title">
								Reflections from Our Conversations
							</h3>
							<div className="memory-modal__reflections">
								<div className="memory-modal__reflection">
									<span className="memory-modal__reflection-label">
										Purpose & Context
									</span>
									<p>{memoryBank.reflections.purposeAndContext}</p>
								</div>
								<div className="memory-modal__reflection">
									<span className="memory-modal__reflection-label">
										Current State
									</span>
									<p>{memoryBank.reflections.currentState}</p>
								</div>
								<div className="memory-modal__reflection">
									<span className="memory-modal__reflection-label">
										Patterns & Preferences
									</span>
									<p>{memoryBank.reflections.approachAndPatterns}</p>
								</div>
							</div>
							<span className="memory-modal__date">
								Last updated{' '}
								{new Date(memoryBank.reflections.lastUpdated).toLocaleDateString()}
							</span>
						</section>
					)}

					{hasQueries && (
						<section className="memory-modal__section">
							<h3 className="memory-modal__section-title">
								Recent Queries ({memoryBank.queries.length})
							</h3>
							<div className="memory-modal__queries">
								{memoryBank.queries.slice(-10).reverse().map((q, i) => (
									<div key={i} className="memory-modal__query">
										<span className="memory-modal__query-source">{q.source}</span>
										<span className="memory-modal__query-text">{q.query}</span>
									</div>
								))}
							</div>
							<span className="memory-modal__date">
								{memoryBank.totalQueryCount} total queries
							</span>
						</section>
					)}

					{!hasAssessment && !hasReflections && !hasQueries && (
						<div className="memory-modal__empty">
							<p>
								No memories yet. Start chatting with me or take the style
								assessment to build your profile.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
