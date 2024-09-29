-- User
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL COMMENT "Holds the user information";
DEFINE FIELD IF NOT EXISTS email ON user TYPE string ASSERT string::is::email($value);
DEFINE FIELD IF NOT EXISTS name ON user TYPE string;
DEFINE FIELD IF NOT EXISTS password ON user TYPE string;
DEFINE FIELD IF NOT EXISTS createdAt ON user VALUE time::now() READONLY;

DEFINE INDEX IF NOT EXISTS user_email_idx ON TABLE user COLUMNS email UNIQUE;

-- Project
DEFINE TABLE IF NOT EXISTS project SCHEMAFULL COMMENT "Holds the project information";
DEFINE FIELD IF NOT EXISTS repositoryUrl ON project TYPE string COMMENT "The git repository url";
DEFINE FIELD IF NOT EXISTS name ON project TYPE string COMMENT "The project name";
DEFINE FIELD IF NOT EXISTS description ON project TYPE string COMMENT "Description of the project";
DEFINE FIELD IF NOT EXISTS icon ON project TYPE string COMMENT "The icon for the project";
DEFINE FIELD IF NOT EXISTS createdAt ON project VALUE time::now() READONLY COMMENT "Creation date of the project";


-- User to Project relation
DEFINE FIELD IF NOT EXISTS in ON can_access TYPE record<user>;
DEFINE FIELD IF NOT EXISTS out ON can_access TYPE record<project>;

DEFINE INDEX IF NOT EXISTS can_access_idx ON TABLE can_access COLUMNS in, out UNIQUE;

-- Knowldege entry
DEFINE TABLE IF NOT EXISTS knowledge COMMENT "Knowledge base entry";
DEFINE FIELD IF NOT EXISTS kind ON TABLE knowledge TYPE string COMMENT "The knowldege type";
DEFINE FIELD IF NOT EXISTS project ON TABLE knowledge TYPE record<project> COMMENT "The project to which this knowledge entry relates";
DEFINE FIELD IF NOT EXISTS embedding ON TABLE knowledge TYPE array<number> COMMENT "The embeddings for the knowledge entry";
DEFINE FIELD IF NOT EXISTS pageContent ON TABLE knowledge TYPE string COMMENT "The knowledge entry content";
DEFINE FIELD IF NOT EXISTS file ON TABLE knowledge TYPE string COMMENT "The full filename and path or url";
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE knowledge TYPE datetime VALUE time::now() COMMENT "Date time when the knowledge entry was updated";

DEFINE INDEX IF NOT EXISTS knowledge_idx ON TABLE knowledge COLUMNS embedding MTREE DIMENSION 768;

-- Chat Conversation
DEFINE TABLE IF NOT EXISTS chat_conversation COMMENT "A chat conversation";
DEFINE FIELD IF NOT EXISTS project ON TABLE knowledge TYPE record<project> COMMENT "The project to which this conversation relates";
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE chat_conversation TYPE datetime VALUE time::now() READONLY COMMENT "Date time when the chat conversation was started";

-- Chat Messages
DEFINE TABLE IF NOT EXISTS chat_message COMMENT "A single chat message in a conversation";
DEFINE FIELD IF NOT EXISTS chatConversation ON TABLE chat_message TYPE record<chat_conversation> COMMENT "The id of the conversation";
DEFINE FIELD IF NOT EXISTS role ON TABLE chat_message TYPE string COMMENT "The role like system, agent, user";
DEFINE FIELD IF NOT EXISTS content ON TABLE chat_message TYPE string COMMENT "The message content";
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE chat_message TYPE datetime VALUE time::now() READONLY COMMENT "Date time when the chat message was created";


-- Example data
INSERT INTO user { email: "user@example.com", name:"John Doe" , password: crypto::argon2::generate('password') } ON DUPLICATE KEY UPDATE password= crypto::argon2::generate('password');
