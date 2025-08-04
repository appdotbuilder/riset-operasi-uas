from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from decimal import Decimal


# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    PROFESSOR = "professor"


class QuestionType(str, Enum):
    MANUAL = "manual"
    AI_GENERATED = "ai_generated"


class QuestionStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExamStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ACTIVE = "active"
    COMPLETED = "completed"
    CLOSED = "closed"


class SubmissionStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password_hash: str = Field(max_length=255)
    full_name: str = Field(max_length=200)
    role: UserRole
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Student specific fields
    student_id: Optional[str] = Field(default=None, max_length=50)

    # Professor specific fields
    employee_id: Optional[str] = Field(default=None, max_length=50)
    department: Optional[str] = Field(default=None, max_length=100)

    # Relationships
    created_topics: List["Topic"] = Relationship(
        back_populates="created_by", sa_relationship_kwargs={"foreign_keys": "Topic.created_by_id"}
    )
    created_questions: List["Question"] = Relationship(
        back_populates="created_by", sa_relationship_kwargs={"foreign_keys": "Question.created_by_id"}
    )
    created_exams: List["Exam"] = Relationship(
        back_populates="created_by", sa_relationship_kwargs={"foreign_keys": "Exam.created_by_id"}
    )
    exam_submissions: List["ExamSubmission"] = Relationship(
        back_populates="student", sa_relationship_kwargs={"foreign_keys": "ExamSubmission.student_id"}
    )
    graded_submissions: List["ExamSubmission"] = Relationship(
        back_populates="graded_by", sa_relationship_kwargs={"foreign_keys": "ExamSubmission.graded_by_id"}
    )


class Topic(SQLModel, table=True):
    __tablename__ = "topics"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    created_by_id: int = Field(foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    created_by: User = Relationship(
        back_populates="created_topics", sa_relationship_kwargs={"foreign_keys": "Topic.created_by_id"}
    )
    questions: List["Question"] = Relationship(back_populates="topic")


class Question(SQLModel, table=True):
    __tablename__ = "questions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    topic_id: int = Field(foreign_key="topics.id")
    title: str = Field(max_length=500)
    content: str = Field(max_length=5000)
    question_type: QuestionType = Field(default=QuestionType.MANUAL)
    status: QuestionStatus = Field(default=QuestionStatus.DRAFT)
    created_by_id: int = Field(foreign_key="users.id")
    approved_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    answer_key: str = Field(default="", max_length=5000)
    points: Decimal = Field(default=Decimal("20"), max_digits=5, decimal_places=2)
    ai_metadata: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = Field(default=None)

    # Relationships
    topic: Topic = Relationship(back_populates="questions")
    created_by: User = Relationship(
        back_populates="created_questions", sa_relationship_kwargs={"foreign_keys": "Question.created_by_id"}
    )
    exam_questions: List["ExamQuestion"] = Relationship(back_populates="question")


class Exam(SQLModel, table=True):
    __tablename__ = "exams"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=300)
    description: str = Field(default="", max_length=1000)
    status: ExamStatus = Field(default=ExamStatus.DRAFT)
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(default=60)  # 1 hour default
    total_questions: int = Field(default=5)
    total_points: Decimal = Field(default=Decimal("100"), max_digits=6, decimal_places=2)
    created_by_id: int = Field(foreign_key="users.id")
    instructions: str = Field(default="", max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    created_by: User = Relationship(
        back_populates="created_exams", sa_relationship_kwargs={"foreign_keys": "Exam.created_by_id"}
    )
    exam_questions: List["ExamQuestion"] = Relationship(back_populates="exam")
    submissions: List["ExamSubmission"] = Relationship(back_populates="exam")


class ExamQuestion(SQLModel, table=True):
    __tablename__ = "exam_questions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id")
    question_id: int = Field(foreign_key="questions.id")
    question_order: int = Field(default=1)
    points: Decimal = Field(default=Decimal("20"), max_digits=5, decimal_places=2)

    # Relationships
    exam: Exam = Relationship(back_populates="exam_questions")
    question: Question = Relationship(back_populates="exam_questions")
    answers: List["Answer"] = Relationship(back_populates="exam_question")


class ExamSubmission(SQLModel, table=True):
    __tablename__ = "exam_submissions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id")
    student_id: int = Field(foreign_key="users.id")
    status: SubmissionStatus = Field(default=SubmissionStatus.NOT_STARTED)
    started_at: Optional[datetime] = Field(default=None)
    submitted_at: Optional[datetime] = Field(default=None)
    graded_at: Optional[datetime] = Field(default=None)
    graded_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    total_score: Optional[Decimal] = Field(default=None, max_digits=6, decimal_places=2)
    final_score: Optional[Decimal] = Field(default=None, max_digits=6, decimal_places=2)
    notes: str = Field(default="", max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    exam: Exam = Relationship(back_populates="submissions")
    student: User = Relationship(
        back_populates="exam_submissions", sa_relationship_kwargs={"foreign_keys": "ExamSubmission.student_id"}
    )
    graded_by: Optional[User] = Relationship(
        back_populates="graded_submissions", sa_relationship_kwargs={"foreign_keys": "ExamSubmission.graded_by_id"}
    )
    answers: List["Answer"] = Relationship(back_populates="submission")


class Answer(SQLModel, table=True):
    __tablename__ = "answers"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: int = Field(foreign_key="exam_submissions.id")
    exam_question_id: int = Field(foreign_key="exam_questions.id")
    image_filename: Optional[str] = Field(default=None, max_length=255)
    image_path: Optional[str] = Field(default=None, max_length=500)
    file_size: Optional[int] = Field(default=None)
    mime_type: Optional[str] = Field(default=None, max_length=100)
    uploaded_at: Optional[datetime] = Field(default=None)
    score: Optional[Decimal] = Field(default=None, max_digits=5, decimal_places=2)
    feedback: str = Field(default="", max_length=1000)
    graded_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    submission: ExamSubmission = Relationship(back_populates="answers")
    exam_question: ExamQuestion = Relationship(back_populates="answers")


class AIQuestionRequest(SQLModel, table=True):
    __tablename__ = "ai_question_requests"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    topic_id: int = Field(foreign_key="topics.id")
    requested_by_id: int = Field(foreign_key="users.id")
    prompt: str = Field(max_length=2000)
    difficulty_level: str = Field(max_length=50)
    generated_content: str = Field(default="", max_length=5000)
    generated_answer_key: str = Field(default="", max_length=5000)
    ai_model_used: str = Field(default="", max_length=100)
    status: str = Field(default="pending", max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = Field(default=None)


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(max_length=200)
    role: UserRole
    student_id: Optional[str] = Field(default=None, max_length=50)
    employee_id: Optional[str] = Field(default=None, max_length=50)
    department: Optional[str] = Field(default=None, max_length=100)


class UserLogin(SQLModel, table=False):
    email: str = Field(max_length=255)
    password: str = Field(max_length=100)


class TopicCreate(SQLModel, table=False):
    name: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)


class QuestionCreate(SQLModel, table=False):
    topic_id: int
    title: str = Field(max_length=500)
    content: str = Field(max_length=5000)
    question_type: QuestionType = Field(default=QuestionType.MANUAL)
    answer_key: str = Field(default="", max_length=5000)
    points: Decimal = Field(default=Decimal("20"), max_digits=5, decimal_places=2)


class QuestionUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=500)
    content: Optional[str] = Field(default=None, max_length=5000)
    answer_key: Optional[str] = Field(default=None, max_length=5000)
    points: Optional[Decimal] = Field(default=None, max_digits=5, decimal_places=2)
    status: Optional[QuestionStatus] = Field(default=None)


class ExamCreate(SQLModel, table=False):
    title: str = Field(max_length=300)
    description: str = Field(default="", max_length=1000)
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(default=60)
    instructions: str = Field(default="", max_length=2000)


class ExamUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = Field(default=None, max_length=1000)
    start_time: Optional[datetime] = Field(default=None)
    end_time: Optional[datetime] = Field(default=None)
    duration_minutes: Optional[int] = Field(default=None)
    status: Optional[ExamStatus] = Field(default=None)
    instructions: Optional[str] = Field(default=None, max_length=2000)


class AnswerUpload(SQLModel, table=False):
    submission_id: int
    exam_question_id: int
    image_filename: str = Field(max_length=255)
    file_size: int
    mime_type: str = Field(max_length=100)


class ScoreUpdate(SQLModel, table=False):
    answer_id: int
    score: Decimal = Field(max_digits=5, decimal_places=2)
    feedback: str = Field(default="", max_length=1000)


class AIQuestionGenerate(SQLModel, table=False):
    topic_id: int
    prompt: str = Field(max_length=2000)
    difficulty_level: str = Field(max_length=50)
