import { useCallback, useEffect, useRef, useState } from 'react';
import DailyWisdomCard from './DailyWisdomCard';
import MessageBubble from './MessageBubble';
import SessionGreetingCard from './SessionGreetingCard';

const BOTTOM_THRESHOLD = 120;
const STARTER_PROMPTS = [
	'Feeling overwhelmed',
	'Finding purpose',
	'Improving focus',
	'Relationship struggles',
	'Self-confidence',
];

const ChatWindow = ({
	messages,
	loading,
	messagesLoading,
	activeChatId,
	forceCompleteToken = 0,
	onStarterSelect,
	starterDisabled = false,
	showDailyWisdom = false,
	onDismissDailyWisdom,
	sessionGreeting,
}) => {
	const containerRef = useRef(null);
	const endRef = useRef(null);
	const shouldAutoScrollRef = useRef(true);
	const previousStateRef = useRef({ chatScopeKey: null, loading: false, messageCount: 0 });
	const [typingTick, setTypingTick] = useState(0);
	const [animatedMessageKey, setAnimatedMessageKey] = useState(null);
	const chatScopeKey = activeChatId || 'guest';

	const getMessageKey = useCallback(
		(message, index) => message.id || `${chatScopeKey}-${index}-${message.role}-${message.content?.length || 0}`,
		[chatScopeKey],
	);

	const shouldAnimateMessage = useCallback(
		(message, index) => {
			if (message.role !== 'assistant') {
				return false;
			}

			return getMessageKey(message, index) === animatedMessageKey;
		},
		[animatedMessageKey, getMessageKey],
	);

	const handleTypingProgress = useCallback(() => {
		setTypingTick((prev) => prev + 1);
	}, []);

	useEffect(() => {
		const previous = previousStateRef.current;
		const switchedChat = previous.chatScopeKey !== chatScopeKey;
		const justFinishedLoadingCycle = previous.loading && !loading;

		if (switchedChat || messagesLoading) {
			setAnimatedMessageKey(null);
			previousStateRef.current = {
				chatScopeKey,
				loading,
				messageCount: messages.length,
			};
			return;
		}

		if (justFinishedLoadingCycle) {
			const lastMessage = messages[messages.length - 1];

			if (lastMessage?.role === 'assistant') {
				setAnimatedMessageKey(getMessageKey(lastMessage, messages.length - 1));
			} else {
				setAnimatedMessageKey(null);
			}
		}

		previousStateRef.current = {
			chatScopeKey,
			loading,
			messageCount: messages.length,
		};
	}, [chatScopeKey, loading, messages, messagesLoading, getMessageKey]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const onScroll = () => {
			const distanceFromBottom =
				container.scrollHeight - container.scrollTop - container.clientHeight;
			shouldAutoScrollRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
		};

		onScroll();
		container.addEventListener('scroll', onScroll, { passive: true });
		return () => container.removeEventListener('scroll', onScroll);
	}, []);

	useEffect(() => {
		if (messagesLoading) {
			return;
		}

		if (!shouldAutoScrollRef.current) {
			return;
		}

		const rafId = requestAnimationFrame(() => {
			endRef.current?.scrollIntoView({
				behavior: typingTick > 0 ? 'auto' : 'smooth',
				block: 'end',
			});
		});

		return () => cancelAnimationFrame(rafId);
	}, [messages, loading, typingTick, messagesLoading]);

	return (
		<section ref={containerRef} className="chat-window" aria-live="polite">
			{sessionGreeting ? <SessionGreetingCard greeting={sessionGreeting} /> : null}
			{showDailyWisdom ? <DailyWisdomCard onDismiss={onDismissDailyWisdom} /> : null}

			{messagesLoading ? (
				<div className="empty-state">
					<h1>Loading chat...</h1>
					<p>Fetching your message history.</p>
				</div>
			) : messages.length === 0 ? (
				<div className="empty-state">
					<h1>What would you like help with today?</h1>
					<p>
						Share what feels heavy or unclear, and KrishnaGPT will offer calm, reflective
						guidance inspired by timeless wisdom.
					</p>

					<div className="starter-grid" role="list" aria-label="Conversation starters">
						{STARTER_PROMPTS.map((starter) => (
							<button
								key={starter}
								type="button"
								role="listitem"
								className="starter-btn"
								onClick={() => onStarterSelect?.(starter)}
								disabled={starterDisabled}
							>
								{starter}
							</button>
						))}
					</div>

				</div>
			) : (
				<div className="message-list">
					{messages.map((message, index) => (
						<MessageBubble
							key={getMessageKey(message, index)}
							role={message.role}
							content={message.content}
							shouldAnimate={shouldAnimateMessage(message, index)}
							onTypingProgress={handleTypingProgress}
							forceCompleteToken={forceCompleteToken}
						/>
					))}

					{loading ? (
						<div className="message-row assistant loading-row">
							<div className="loading-bubble" aria-label="Assistant is typing">
								<span className="typing-dot" />
								<span className="typing-dot" />
								<span className="typing-dot" />
							</div>
							<span className="typing-label">KrishnaGPT is reflecting...</span>
						</div>
					) : null}

					<div ref={endRef} />
				</div>
			)}
		</section>
	);
};

export default ChatWindow;
