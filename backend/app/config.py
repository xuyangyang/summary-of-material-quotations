from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"
    database_url: str = "sqlite:///./data/app.db"
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
