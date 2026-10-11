"use client";

import { useState } from "react";
import { Button } from "../../../../components/Button";
import { Field } from "../../../../components/Field";

export function AskForm({
  collections,
  defaultCollectionId,
  defaultQuestion,
}: {
  collections: Array<{ id: string; name: string }>;
  defaultCollectionId: string;
  defaultQuestion: string;
}) {
  const [collectionId, setCollectionId] = useState(defaultCollectionId);
  const [question, setQuestion] = useState(defaultQuestion);

  return (
    <form
      className="stack-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Field label="Collection" htmlFor="ask-collection">
        <select
          id="ask-collection"
          className="field-control"
          value={collectionId}
          onChange={(event) => setCollectionId(event.target.value)}
        >
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Question" htmlFor="ask-question">
        <input
          id="ask-question"
          className="field-control"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
      </Field>
      <div className="row">
        <Button variant="primary" size="md" type="submit" disabled={!question.trim()}>
          Ask
        </Button>
      </div>
    </form>
  );
}
