import { useCallback, useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';

const BOTTOM_THRESHOLD = 120;

const ChatWindow = ({ messages, loading }) => {
	const containerRef = useRef(null);
	const endRef = useRef(null);
	const shouldAutoScrollRef = useRef(true);
	const [typingTick, setTypingTick] = useState(0);

	const handleTypingProgress = useCallback(() => {
		setTypingTick((prev) => prev + 1);
	}, []);

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
	}, [messages, loading, typingTick]);

	return (
		<section ref={containerRef} className="chat-window" aria-live="polite">
			{messages.length === 0 ? (
				<div className="empty-state">
					<h1>What is on your mind today?</h1>
					<p>
						Share what feels heavy or unclear, and KrishnaGPT will offer calm, reflective
						guidance inspired by timeless wisdom.
					</p>
				</div>
			) : (
				<div className="message-list">
					{messages.map((message, index) => (
						<MessageBubble
							key={index}
							role={message.role}
							content={message.content}
							onTypingProgress={handleTypingProgress}
						/>
					))}

					{loading ? (
						<div className="message-row assistant loading-row">
							<div className="loading-bubble" aria-label="Assistant is typing">
								<span className="typing-dot" />
								<span className="typing-dot" />
								<span className="typing-dot" />
							</div>
						</div>
					) : null}

					<div ref={endRef} />
				</div>
			)}
		</section>
	);
};

export default ChatWindow;
