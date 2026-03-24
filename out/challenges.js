"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHALLENGES = void 0;
exports.CHALLENGES = [
    {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        description: 'Find two indices that add up to a target.',
        estimatedMinutes: 15,
        prompt: `Given an array of integers nums and an integer target,
return indices of the two numbers such that they add up to target.
You may assume each input has exactly one solution.

Example:
  Input:  nums = [2, 7, 11, 15], target = 9
  Output: [0, 1]

Implement:
  function twoSum(nums: number[], target: number): number[]`,
    },
    {
        id: 'palindrome',
        title: 'Valid Palindrome',
        difficulty: 'Easy',
        description: 'Check if a string is a palindrome ignoring non-alphanumeric chars.',
        estimatedMinutes: 15,
        prompt: `A phrase is a palindrome if, after converting all uppercase letters
to lowercase and removing all non-alphanumeric characters, it reads
the same forward and backward.

Example:
  Input:  "A man, a plan, a canal: Panama"
  Output: true

Implement:
  function isPalindrome(s: string): boolean`,
    },
    {
        id: 'valid-brackets',
        title: 'Valid Brackets',
        difficulty: 'Easy',
        description: 'Check if bracket sequences are valid.',
        estimatedMinutes: 20,
        prompt: `Given a string s containing just '(', ')', '{', '}', '[' and ']',
determine if the input string is valid.

An input string is valid if:
  1. Open brackets are closed by the same type of brackets.
  2. Open brackets are closed in the correct order.

Example:
  Input:  "()[]{}"  → true
  Input:  "(]"      → false

Implement:
  function isValid(s: string): boolean`,
    },
    {
        id: 'reverse-linked-list',
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        description: 'Reverse a singly linked list.',
        estimatedMinutes: 20,
        prompt: `Given the head of a singly linked list, reverse the list
and return the reversed list.

class ListNode { val: number; next: ListNode | null; }

Example:
  Input:  1 -> 2 -> 3 -> 4 -> 5
  Output: 5 -> 4 -> 3 -> 2 -> 1

Implement:
  function reverseList(head: ListNode | null): ListNode | null`,
    },
    {
        id: 'max-subarray',
        title: 'Maximum Subarray',
        difficulty: 'Medium',
        description: "Kadane's algorithm — find the subarray with the largest sum.",
        estimatedMinutes: 25,
        prompt: `Given an integer array nums, find the subarray with the largest sum
and return its sum.

Example:
  Input:  [-2, 1, -3, 4, -1, 2, 1, -5, 4]
  Output: 6  (subarray [4,-1,2,1])

Implement:
  function maxSubArray(nums: number[]): number`,
    },
    {
        id: 'lru-cache',
        title: 'LRU Cache',
        difficulty: 'Medium',
        description: 'Design a data structure that follows LRU eviction.',
        estimatedMinutes: 35,
        prompt: `Design a data structure that follows the constraints of a
Least Recently Used (LRU) cache.

Implement the LRUCache class:
  - LRUCache(capacity: number) initialises the cache
  - get(key: number): number — returns value or -1 if not found
  - put(key: number, value: number): void — insert/update;
    if capacity exceeded, evict the least recently used key.

Both get and put must run in O(1) average time complexity.`,
    },
    {
        id: 'word-search',
        title: 'Word Search',
        difficulty: 'Medium',
        description: 'Find if a word exists in a 2D grid using DFS.',
        estimatedMinutes: 30,
        prompt: `Given an m x n grid of characters board and a string word,
return true if word exists in the grid. The word can be constructed
from letters of sequentially adjacent cells (horizontal/vertical).
The same cell may not be used more than once.

Example:
  board = [["A","B","C","E"],
           ["S","F","C","S"],
           ["A","D","E","E"]]
  word = "ABCCED" → true

Implement:
  function exist(board: string[][], word: string): boolean`,
    },
    {
        id: 'serialize-tree',
        title: 'Serialize Binary Tree',
        difficulty: 'Hard',
        description: 'Serialize and deserialize a binary tree.',
        estimatedMinutes: 40,
        prompt: `Design an algorithm to serialize and deserialize a binary tree.

class TreeNode { val: number; left: TreeNode | null; right: TreeNode | null; }

Implement:
  function serialize(root: TreeNode | null): string
  function deserialize(data: string): TreeNode | null

There is no restriction on how your serialization/deserialization
algorithm should work — just ensure the tree can be reconstructed.`,
    },
    {
        id: 'trapping-rain',
        title: 'Trapping Rain Water',
        difficulty: 'Hard',
        description: 'Compute how much water can be trapped after raining.',
        estimatedMinutes: 40,
        prompt: `Given n non-negative integers representing an elevation map
where the width of each bar is 1, compute how much water it can trap
after raining.

Example:
  Input:  height = [0,1,0,2,1,0,1,3,2,1,2,1]
  Output: 6

Implement:
  function trap(height: number[]): number`,
    },
    {
        id: 'median-two-arrays',
        title: 'Median of Two Sorted Arrays',
        difficulty: 'Hard',
        description: 'Find the median of two sorted arrays in O(log(m+n)).',
        estimatedMinutes: 45,
        prompt: `Given two sorted arrays nums1 and nums2 of size m and n respectively,
return the median of the two sorted arrays.
The overall run time complexity should be O(log(m+n)).

Example:
  Input:  nums1 = [1,3], nums2 = [2]
  Output: 2.0

  Input:  nums1 = [1,2], nums2 = [3,4]
  Output: 2.5

Implement:
  function findMedianSortedArrays(nums1: number[], nums2: number[]): number`,
    },
];
//# sourceMappingURL=challenges.js.map