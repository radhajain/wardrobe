import { useState } from 'react';
import { AssessmentQuestion } from '../../types';
import {
	generateAssessmentSummary,
	saveAssessmentResponses,
	getAssessmentResponses,
} from '../../services/memoryBank';
import './StyleAssessment.css';

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
	{
		id: 'typical-week',
		category: 'lifestyle',
		question: 'What does a typical week look like for you?',
		placeholder:
			'e.g., I work in a creative office 3 days, work from home 2 days, and go out with friends on weekends...',
	},
	{
		id: 'feel-in-clothes',
		category: 'lifestyle',
		question: 'How do you want to feel in your clothes?',
		placeholder: 'e.g., Confident, effortless, put-together, comfortable...',
	},
	{
		id: 'style-communicate',
		category: 'lifestyle',
		question: 'What do you want your style to communicate?',
		placeholder:
			'e.g., That I have good taste, that I value quality, that I am creative...',
	},
	{
		id: 'frustrated-dressing',
		category: 'painPoints',
		question: 'When do you feel most frustrated when getting dressed?',
		placeholder:
			'e.g., When I have nothing that goes together, when I need something specific for an event...',
	},
	{
		id: 'want-to-try',
		category: 'painPoints',
		question:
			"What would you love to try but don't know how to incorporate into your wardrobe?",
		placeholder:
			'e.g., More color, statement pieces, a more relaxed aesthetic...',
	},
	{
		id: 'who-admire',
		category: 'inspiration',
		question: 'Who do you follow or admire for their style?',
		placeholder:
			'e.g., Celebrities, influencers, designers, friends, fictional characters...',
	},
	{
		id: 'most-confident',
		category: 'inspiration',
		question: 'What outfits make you feel most confident?',
		placeholder:
			'e.g., All-black looks, tailored pieces, flowy dresses, casual jeans and a great top...',
	},
];

interface StyleAssessmentProps {
	onComplete: () => void;
	onCancel: () => void;
}

export function StyleAssessment({ onComplete, onCancel }: StyleAssessmentProps) {
	const existingAssessment = getAssessmentResponses();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>(
		existingAssessment?.answers || {}
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<string | null>(
		existingAssessment?.summary || null
	);
	const [showSummary, setShowSummary] = useState(!!existingAssessment);

	const currentQuestion = ASSESSMENT_QUESTIONS[currentIndex];
	const isLastQuestion = currentIndex === ASSESSMENT_QUESTIONS.length - 1;
	const progress = ((currentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100;

	const handleAnswer = (value: string) => {
		setAnswers((prev) => ({
			...prev,
			[currentQuestion.id]: value,
		}));
	};

	const handleNext = () => {
		if (isLastQuestion) {
			handleSubmit();
		} else {
			setCurrentIndex((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && e.metaKey && answers[currentQuestion.id]?.trim()) {
			handleNext();
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setError(null);
		try {
			const generatedSummary = await generateAssessmentSummary(answers);
			setSummary(generatedSummary);

			saveAssessmentResponses({
				answers,
				summary: generatedSummary,
				completedAt: new Date().toISOString(),
			});

			setShowSummary(true);
		} catch (err) {
			console.error('Failed to generate summary:', err);
			const message = err instanceof Error ? err.message : 'Unknown error';
			if (message.includes('429') || message.includes('rate')) {
				setError('Too many requests. Please wait a moment and try again.');
			} else {
				setError('Failed to generate your style profile. Please try again.');
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	if (showSummary && summary) {
		return (
			<div className="assessment">
				<div className="assessment__summary">
					<h2 className="assessment__summary-title">Your Style Profile</h2>
					<div className="assessment__summary-content">
						{summary.split('\n\n').map((paragraph, i) => (
							<p key={i}>{paragraph}</p>
						))}
					</div>
					<div className="assessment__summary-actions">
						<button
							className="assessment__btn assessment__btn--secondary"
							onClick={() => {
								setShowSummary(false);
								setCurrentIndex(0);
							}}
						>
							Retake Assessment
						</button>
						<button
							className="assessment__btn assessment__btn--primary"
							onClick={onComplete}
						>
							Done
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="assessment">
			<button className="assessment__close" onClick={onCancel}>
				&times;
			</button>

			<div className="assessment__progress">
				<div
					className="assessment__progress-bar"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<div className="assessment__content">
				<span className="assessment__category">
					{currentQuestion.category === 'lifestyle' && 'Lifestyle & Goals'}
					{currentQuestion.category === 'painPoints' && 'Pain Points'}
					{currentQuestion.category === 'inspiration' && 'Inspiration'}
				</span>

				<h2 className="assessment__question">{currentQuestion.question}</h2>

				<textarea
					className="assessment__textarea"
					value={answers[currentQuestion.id] || ''}
					onChange={(e) => handleAnswer(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={currentQuestion.placeholder}
					autoFocus
					rows={4}
				/>

				<p className="assessment__hint">Press Cmd+Enter to continue</p>

				{error && <p className="assessment__error">{error}</p>}
			</div>

			<div className="assessment__nav">
				<button
					className="assessment__nav-btn"
					onClick={handleBack}
					disabled={currentIndex === 0}
				>
					Back
				</button>

				<span className="assessment__counter">
					{currentIndex + 1} / {ASSESSMENT_QUESTIONS.length}
				</span>

				<button
					className="assessment__nav-btn assessment__nav-btn--primary"
					onClick={handleNext}
					disabled={!answers[currentQuestion.id]?.trim() || isSubmitting}
				>
					{isSubmitting
						? 'Analyzing...'
						: isLastQuestion
							? 'Complete'
							: 'Next'}
				</button>
			</div>
		</div>
	);
}
