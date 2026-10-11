"use client";

import { useState } from "react";
import { Button } from "../../../../components/Button";

export function AskForm({ defaultQuestion }: { defaultQuestion: string }) {
  const [question, setQuestion] = useState(defaultQuestion);

  return (
    <form
      className="row"
      style={{ alignItems: "flex-end" }}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div style={{ flex: 1 }}>
        <label className="sr-only" htmlFor="ask-question">
          Question
        </label>
        <input
          id="ask-question"
          className="field-control"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
      </div>
      <Button variant="primary" size="lg" type="submit" disabled={!question.trim()}>
        Ask
      </Button>
    </form>
  );
}
