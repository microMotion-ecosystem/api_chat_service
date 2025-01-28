import { IsEnum, } from "class-validator";
import { MODEL } from "src/types/enum";

export class QueryModelDto {
    @IsEnum(MODEL, {
        message: 'model must be one of the following values: deepseek-v3, gemini-1.5-flash ,claude-3-5-sonnet, gpt-4o',
      })
    llm_type: MODEL;
}