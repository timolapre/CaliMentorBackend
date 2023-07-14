import axios from "axios";

import { Workout } from "../entities/workout";
import { User } from "../entities/user";

const AIprompt = `
As a proficient AI model, your task is to generate a new calisthenics workout plan. 
Use the given structure and format to ensure the workout is well-rounded and engaging. 
It's important it follows this exact JSON structure without spaces and without newlines as it needs to be interpreted by an external API. 
Here is the desired structure:
{"name": (Insert a creative, yet descriptive name for the workout),
"description": (Provide a brief summary of the workout, motivating the user to complete it),
"type": (Specify whether it's a Full body workout = 1, Upper body workout = 2, Legs workout = 3, Push workout = 4, Pull workout = 5, or Core workout = 9),
"difficulty": (Indicate if it's suited for Beginners = 1, Intermediate = 2, or Advanced = 3),
"duration": (Provide a rough estimate of the workout's duration. Options are <30 minutes = 1, 30-60 minutes = 2, 60-90 minutes = 3, or >90 minutes = 4),
"blocks": (Choose as many as you want in any order but between the following block types: TABATA, EMOM, Circuit. Pick as many blocks in any order and excersises within blocks as fits within the workout)
[{"type": TABATA, "values": (insert rounds, seconds work, seconds rest in the form of [x,y,z]), "exercises": [{"name": (Choose an exercise), "count": (choose arepetition number), "append": (depends on excerise. 'x' when exercise doing for repetitions, 's' when holding erxercise for seconds)}]}
{"type": Circuit, "values": [(insert sets)], "exercises": [{"name": (Choose an exercise), "count": (choose a repetition number), "append": (depends on excerise. 'x' when exercise doing for repetitions, 's' when holding erxercise for seconds)}]}
{"type": EMOM, "values": (Every x seconds for y rounds in form of [x,y]), "exercises": [{"name": (Choose an exercise), "count": (choose a repetition number),"append": (depends on excerise. 'x' when exercise doing for repetitions, 's' when holding erxercise for seconds)}]}]}
Pick excerises exclusively out of this list. Follow this exact naming of exercises as it needs to be interpreted by an external API. Please ensure you maintain consistent letter casing, using the same uppercase and lowercase letters throughout.
Archer pull ups, Archer push ups, Archer squats, Back rows, Bicep curls, Burpees, Calf raises, Chin ups, Close grip pull ups, Close grip push ups, Decline push ups, Diamond push ups, Dips, Chair dips, Face pulls, Frontlever raises, Jumping jacks, L sit, Leg raises, Knee raises, Toes to bar, Lunges, Jumping lunges, Lying leg raises, Military pull ups, Mountain climbers, Muscle ups, Narrow stance squats, Pike ups, Pistol squats, Plank, Pull ups, Australian pull ups, Assisted pull ups, Negative pull ups, High pull ups, Explosive pull ups, Push ups, Wall push ups, Incline push ups, Knee push ups, Explosive push ups, Ring dips, Ring flies, Ring push ups, Ring rows, Scapula pull ups, Sit ups, Crunches, V crunches, Skull crushers, Squats, Jumping squats, Straight bar dips, Swan raises, Tricep extensions, Typewriter pull ups, Typewriter push ups, V sit, V-sit pike ups, Windshield wipers. 
Consider the overall difficulty and duration when choosing exercises and specifying the numbers of sets or repetitions`;

// create
async function create(reqWorkout, userRepo, workoutRepo): Promise<string> {
  let workout = new Workout();
  workout = { ...reqWorkout };
  workout.blocks = JSON.stringify(reqWorkout.blocks);
  workout.user = await userRepo.findOne({
    id: "27788c8f-2194-11ee-b044-f4a80d77b910",
  });
  const success = await workoutRepo.save(workout);

  return success.id || null;
}
export async function createAIWorkout(
  input,
  connection
): Promise<{
  success: boolean;
  message: string;
}> {
  const workoutRepo = connection.getRepository(Workout);
  const userRepo = connection.getRepository(User);

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions?model=gpt-4",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: AIprompt,
        },
        {
          role: "user",
          content: input || "Create a random workout",
        },
      ],
    },
    { headers: { Authorization: `Bearer ${process.env.GPT_API_KEY}` } }
  );
  if (!data.choices[0]?.message?.content) {
    return {
      success: false,
      message: data,
    };
  }
  const workoutData = JSON.parse(data.choices[0].message.content);
  await create(workoutData, userRepo, workoutRepo);
  return {
    success: true,
    message: "Created new AI workout",
  };
}
