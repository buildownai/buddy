-- User
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL COMMENT "Holds the user information";
DEFINE FIELD IF NOT EXISTS email ON user TYPE string VALUE string::lowercase($value) ASSERT string::is::email($value) COMMENT "The email of the user";
DEFINE FIELD IF NOT EXISTS name ON user TYPE string COMMENT "The natural name of the user";
DEFINE FIELD IF NOT EXISTS password ON user TYPE string VALUE crypto::argon2::generate($value) COMMENT "The encrypted password of the user";
DEFINE FIELD IF NOT EXISTS language ON user TYPE string DEFAULT "en" COMMENT "The preferred user language";
DEFINE FIELD IF NOT EXISTS createdAt ON user DEFAULT time::now() READONLY COMMENT "Creation date of the user";
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE user TYPE datetime VALUE time::now() COMMENT "Date time when the user was updated";

DEFINE INDEX IF NOT EXISTS user_email_idx ON TABLE user COLUMNS email UNIQUE COMMENT "Unique user email constraint";

-- Project
DEFINE TABLE IF NOT EXISTS project SCHEMAFULL COMMENT "Holds the project information";
DEFINE FIELD IF NOT EXISTS repositoryUrl ON project TYPE string COMMENT "The git repository url";
DEFINE FIELD IF NOT EXISTS localFolder ON project TYPE option<string> COMMENT "The local folder of the project";
DEFINE FIELD IF NOT EXISTS name ON project TYPE string COMMENT "The project name";
DEFINE FIELD IF NOT EXISTS description ON project TYPE string COMMENT "Description of the project";
DEFINE FIELD IF NOT EXISTS icon ON project TYPE option<string> COMMENT "The icon for the project";
DEFINE FIELD IF NOT EXISTS createdAt ON project DEFAULT time::now() READONLY COMMENT "Creation date of the project";
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE project TYPE datetime VALUE time::now() COMMENT "Date time when the project was updated";


-- User to Project relation
DEFINE FIELD IF NOT EXISTS in ON can_access TYPE record<user>;
DEFINE FIELD IF NOT EXISTS out ON can_access TYPE record<project>;

DEFINE INDEX IF NOT EXISTS can_access_idx ON TABLE can_access COLUMNS in, out UNIQUE COMMENT "Unique constraint index for user to project relation";

-- Knowldege entry
DEFINE TABLE IF NOT EXISTS knowledge COMMENT "Knowledge base entry";
DEFINE FIELD IF NOT EXISTS kind ON TABLE knowledge TYPE string COMMENT "The knowldege type";
DEFINE FIELD IF NOT EXISTS project ON TABLE knowledge TYPE record<project> COMMENT "The project to which this knowledge entry relates";
DEFINE FIELD IF NOT EXISTS embedding ON TABLE knowledge TYPE array<number> COMMENT "The embeddings for the knowledge entry";
DEFINE FIELD IF NOT EXISTS pageContent ON TABLE knowledge TYPE string COMMENT "The knowledge entry content";
DEFINE FIELD IF NOT EXISTS file ON TABLE knowledge TYPE string COMMENT "The full filename and path or url";
DEFINE FIELD IF NOT EXISTS branch ON TABLE knowledge TYPE option<string> COMMENT "The git branch name";
DEFINE FIELD IF NOT EXISTS createdAt ON knowledge DEFAULT time::now() READONLY COMMENT "Creation date of the knowledge entry";
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE knowledge TYPE datetime VALUE time::now() COMMENT "Date time when the knowledge entry was updated";

DEFINE INDEX IF NOT EXISTS knowledge_idx ON TABLE knowledge COLUMNS embedding MTREE DIMENSION $EMBEDDING_SIZE COMMENT "Index of the embedding vectors";

-- Chat Conversation
DEFINE TABLE IF NOT EXISTS chat_conversation COMMENT "A chat conversation";
DEFINE FIELD IF NOT EXISTS summary ON TABLE knowledge TYPE string DEFAULT "" COMMENT "Summary of the conversation";
DEFINE FIELD IF NOT EXISTS project ON TABLE knowledge TYPE record<project> COMMENT "The project to which this conversation relates";
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE chat_conversation TYPE datetime VALUE time::now() READONLY COMMENT "Date time when the chat conversation was started";

-- Chat Messages
DEFINE TABLE IF NOT EXISTS chat_message COMMENT "A single chat message in a conversation";
DEFINE FIELD IF NOT EXISTS chatConversation ON TABLE chat_message TYPE record<chat_conversation> COMMENT "The id of the conversation";
DEFINE FIELD IF NOT EXISTS role ON TABLE chat_message TYPE string COMMENT "The role like system, agent, user";
DEFINE FIELD IF NOT EXISTS content ON TABLE chat_message TYPE string COMMENT "The message content";
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE chat_message TYPE datetime VALUE time::now() READONLY COMMENT "Date time when the chat message was created";

-- Task
DEFINE TABLE IF NOT EXISTS task COMMENT "A single task";
DEFINE FIELD IF NOT EXISTS project ON TABLE task TYPE record<project> COMMENT "The project to which this task relates";
DEFINE FIELD IF NOT EXISTS branch ON TABLE task TYPE option<string> COMMENT "The git branch name";
DEFINE FIELD IF NOT EXISTS status ON TABLE task TYPE string COMMENT "The status of the job";
DEFINE FIELD IF NOT EXISTS kind ON TABLE task TYPE string COMMENT "The task kind";
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE task TYPE datetime VALUE time::now() READONLY COMMENT "Date time when the task was created";
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE task TYPE datetime VALUE time::now() COMMENT "Date time when the task was updated";
DEFINE FIELD IF NOT EXISTS payload ON TABLE task FLEXIBLE TYPE object COMMENT "The payload of the task";

DEFINE INDEX IF NOT EXISTS task_exist_loopkup_idx ON TABLE task COLUMNS status,kind,payload.file,payload.branch COMMENT "Search index by status, kind, file and branch";

-- Example data
INSERT INTO user { email: "user@example.com", name:"John Doe" , password: 'password' } ON DUPLICATE KEY UPDATE password= 'password';
