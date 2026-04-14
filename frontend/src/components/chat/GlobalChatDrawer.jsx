import React from "react";
import EmployeeChatDrawer from "./EmployeeChatDrawer";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";

export default function GlobalChatDrawer({ currentUserId }) {
    const { darkMode } = useTheme();

    const {
        activeTabs,
        activeConversationId,
        messagesByConversation,
        draftsByConversation,
        loadingByConversation,
        sendingByConversation,
        isOpen,
        setIsOpen,
        closeTab,
        selectTab,
        setDraft,
        sendMessage,
        closeConversation
    } = useChat();

    const hasAnyChat = activeTabs.length > 0;

    // keep a collapsed launcher visible whenever there is at least one tab
    if (!isOpen && !hasAnyChat) return null;

    return (
        <EmployeeChatDrawer
            darkMode={darkMode}
            isOpen={isOpen}
            activeTabs={activeTabs}
            activeConversationId={activeConversationId}
            messagesByConversation={messagesByConversation}
            draftsByConversation={draftsByConversation}
            loadingByConversation={loadingByConversation}
            currentUserId={currentUserId}
            sendingMessage={
                activeConversationId != null
                    ? sendingByConversation?.[activeConversationId] || false
                    : false
            }
            onOpen={() => setIsOpen(true)}
            onMinimize={() => setIsOpen(false)}
            onSelectTab={selectTab}
            onCloseTab={closeTab}
            onDraftChange={(value, convo) => {
                if (!convo?.conversationId) return;
                setDraft(convo.conversationId, value);
            }}
            onSendMessage={(e) => {
                e?.preventDefault?.();

                const activeTab = activeTabs.find(
                    (tab) =>
                        Number(tab.conversationId) === Number(activeConversationId)
                );

                if (!activeTab) return;

                sendMessage(activeTab);
            }}
            onCloseConversation={closeConversation}
        />
    );
}